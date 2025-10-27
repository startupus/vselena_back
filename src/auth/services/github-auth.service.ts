import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthMethodType } from '../enums/auth-method-type.enum';
import { OAuthCallbackResult, OAuthMetadata } from '../interfaces/multi-auth.interface';

@Injectable()
export class GitHubAuthService {
  private readonly logger = new Logger(GitHubAuthService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('GITHUB_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('GITHUB_CLIENT_SECRET') || '';
    this.redirectUri = this.configService.get<string>('GITHUB_REDIRECT_URI') || 'http://localhost:3001/api/auth/multi/oauth/github/callback';
  }

  /**
   * Получение URL для авторизации через GitHub
   */
  getAuthUrl(state?: string): string {
    if (!this.clientId) {
      this.logger.error('❌ GitHub OAuth не настроен! Пожалуйста, создайте OAuth App на https://github.com/settings/developers');
      throw new Error('GitHub OAuth не настроен. Создайте OAuth приложение на https://github.com/settings/developers и добавьте GITHUB_CLIENT_ID в .env');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'user:email',
      state: state || this.generateState(),
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Обработка callback от GitHub
   */
  async handleCallback(
    code: string,
    state?: string,
  ): Promise<OAuthCallbackResult> {
    try {
      // Обмениваем код на access token
      const accessToken = await this.exchangeCodeForToken(code);
      
      // Получаем данные пользователя
      const userData = await this.getUserData(accessToken);
      
      // Получаем email пользователя
      const emailData = await this.getUserEmails(accessToken);
      
      // Формируем метаданные
      const metadata: OAuthMetadata = {
        provider: 'github',
        providerId: userData.id.toString(),
        username: userData.login,
        avatarUrl: userData.avatar_url,
        profileUrl: userData.html_url,
        accessToken,
        scopes: ['user:email'],
      };

      // Проверяем, есть ли пользователь с таким GitHub ID
      const existingUser = await this.findUserByGitHubId(userData.id.toString());
      
      if (existingUser) {
        // Обновляем метаданные существующего пользователя
        await this.updateUserOAuthMetadata(existingUser.id, metadata);
        
        return {
          success: true,
          user: existingUser,
          // Здесь должны быть сгенерированы accessToken и refreshToken
        };
      }

      // Проверяем, есть ли пользователь с таким email
      const primaryEmail = emailData.find(email => email.primary)?.email;
      if (primaryEmail) {
        const userByEmail = await this.findUserByEmail(primaryEmail);
        
        if (userByEmail) {
          // Нужно слияние аккаунтов
          const conflicts = await this.detectConflicts(userByEmail, userData, emailData);
          
          return {
            success: false,
            requiresMerge: true,
            conflicts,
          };
        }
      }

      // Создаем нового пользователя
      const newUser = await this.createUserFromGitHub(userData, emailData, metadata);
      
      return {
        success: true,
        user: newUser,
        // Здесь должны быть сгенерированы accessToken и refreshToken
      };

    } catch (error) {
      this.logger.error(`Ошибка обработки GitHub callback: ${error.message}`);
      return {
        success: false,
        error: 'Ошибка авторизации через GitHub',
      };
    }
  }

  /**
   * Обновление access token
   */
  async refreshAccessToken(refreshToken: string): Promise<string | null> {
    // GitHub не предоставляет refresh token в стандартном OAuth 2.0 flow
    // Токены GitHub не истекают, но могут быть отозваны пользователем
    // Здесь можно реализовать проверку валидности токена
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${refreshToken}`,
        },
      });

      if (response.ok) {
        return refreshToken; // Токен все еще валиден
      } else {
        return null; // Токен недействителен
      }
    } catch (error) {
      this.logger.error(`Ошибка проверки GitHub токена: ${error.message}`);
      return null;
    }
  }

  /**
   * Отзыв access token
   */
  async revokeAccessToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`https://api.github.com/applications/${this.clientId}/tokens/${accessToken}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        },
      });

      return response.ok;
    } catch (error) {
      this.logger.error(`Ошибка отзыва GitHub токена: ${error.message}`);
      return false;
    }
  }

  // Приватные методы

  private async exchangeCodeForToken(code: string): Promise<string> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`GitHub token exchange error: ${data.error_description}`);
    }

    return data.access_token;
  }

  private async getUserData(accessToken: string): Promise<any> {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch GitHub user data: ${response.statusText}`);
    }

    return response.json();
  }

  private async getUserEmails(accessToken: string): Promise<any[]> {
    const response = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch GitHub user emails: ${response.statusText}`);
    }

    return response.json();
  }

  private async findUserByGitHubId(githubId: string): Promise<any> {
    // Здесь должна быть логика поиска пользователя в БД по GitHub ID
    // Пока возвращаем null
    return null;
  }

  private async findUserByEmail(email: string): Promise<any> {
    // Здесь должна быть логика поиска пользователя в БД по email
    // Пока возвращаем null
    return null;
  }

  private async updateUserOAuthMetadata(userId: string, metadata: OAuthMetadata): Promise<void> {
    // Здесь должна быть логика обновления метаданных пользователя в БД
    this.logger.log(`Обновлены GitHub метаданные для пользователя ${userId}`);
  }

  private async createUserFromGitHub(
    userData: any,
    emailData: any[],
    metadata: OAuthMetadata,
  ): Promise<any> {
    // Здесь должна быть логика создания нового пользователя в БД
    const primaryEmail = emailData.find(email => email.primary)?.email;
    
    const newUser = {
      email: primaryEmail,
      firstName: userData.name?.split(' ')[0] || userData.login,
      lastName: userData.name?.split(' ').slice(1).join(' ') || '',
      avatarUrl: userData.avatar_url,
      githubId: userData.id.toString(),
      githubUsername: userData.login,
      githubVerified: true,
      primaryAuthMethod: AuthMethodType.GITHUB.toString(),
      availableAuthMethods: [AuthMethodType.GITHUB.toString()],
      oauthMetadata: metadata,
    };

    this.logger.log(`Создан новый пользователь через GitHub: ${newUser.email}`);
    return newUser;
  }

  private async detectConflicts(
    existingUser: any,
    githubUserData: any,
    emailData: any[],
  ): Promise<any> {
    const conflicts: any = {};

    const primaryEmail = emailData.find(email => email.primary)?.email;
    
    if (existingUser.email && existingUser.email !== primaryEmail) {
      conflicts.email = {
        primary: existingUser.email,
        secondary: primaryEmail,
      };
    }

    if (existingUser.firstName && existingUser.firstName !== githubUserData.name?.split(' ')[0]) {
      conflicts.firstName = {
        primary: existingUser.firstName,
        secondary: githubUserData.name?.split(' ')[0] || githubUserData.login,
      };
    }

    return conflicts;
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}