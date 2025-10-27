import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthMethodType } from '../enums/auth-method-type.enum';
import { OAuthCallbackResult, OAuthMetadata } from '../interfaces/multi-auth.interface';

@Injectable()
export class GosuslugiAuthService {
  private readonly logger = new Logger(GosuslugiAuthService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('GOSUSLUGI_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('GOSUSLUGI_CLIENT_SECRET') || '';
    this.redirectUri = this.configService.get<string>('GOSUSLUGI_REDIRECT_URI') || 'http://localhost:3001/api/auth/multi/oauth/gosuslugi/callback';
    this.baseUrl = this.configService.get<string>('GOSUSLUGI_BASE_URL') || 'https://esia.gosuslugi.ru';
  }

  /**
   * Получение URL для авторизации через Госуслуги
   */
  getAuthUrl(state?: string): string {
    if (!this.clientId) {
      this.logger.error('❌ Госуслуги OAuth не настроен! Требуется регистрация в ЕСИА');
      throw new Error('Госуслуги OAuth не настроен. Требуется регистрация в ЕСИА и добавление GOSUSLUGI_CLIENT_ID в .env');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'openid name email',
      response_type: 'code',
      state: state || this.generateState(),
      access_type: 'offline',
    });

    return `${this.baseUrl}/aas/oauth2/ac?${params.toString()}`;
  }

  /**
   * Обработка callback от Госуслуг
   */
  async handleCallback(
    code: string,
    state?: string,
  ): Promise<OAuthCallbackResult> {
    try {
      // Обмениваем код на access token
      const tokenData = await this.exchangeCodeForToken(code);
      
      // Получаем данные пользователя
      const userData = await this.getUserData(tokenData.access_token);
      
      // Формируем метаданные
      const metadata: OAuthMetadata = {
        provider: 'gosuslugi',
        providerId: userData.sub || userData.urn,
        username: userData.name || userData.fullName,
        avatarUrl: userData.avatar_url,
        profileUrl: `${this.baseUrl}/profile`,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
        scopes: ['openid', 'name', 'email'],
      };

      // Проверяем, есть ли пользователь с таким Госуслуги ID
      const existingUser = await this.findUserByGosuslugiId(metadata.providerId);
      
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
      if (userData.email) {
        const userByEmail = await this.findUserByEmail(userData.email);
        
        if (userByEmail) {
          // Нужно слияние аккаунтов
          const conflicts = await this.detectConflicts(userByEmail, userData);
          
          return {
            success: false,
            requiresMerge: true,
            conflicts,
          };
        }
      }

      // Создаем нового пользователя
      const newUser = await this.createUserFromGosuslugi(userData, metadata);
      
      return {
        success: true,
        user: newUser,
        // Здесь должны быть сгенерированы accessToken и refreshToken
      };

    } catch (error) {
      this.logger.error(`Ошибка обработки Госуслуги callback: ${error.message}`);
      return {
        success: false,
        error: 'Ошибка авторизации через Госуслуги',
      };
    }
  }

  /**
   * Обновление access token
   */
  async refreshAccessToken(refreshToken: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/aas/oauth2/te`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      this.logger.error(`Ошибка обновления Госуслуги токена: ${error.message}`);
      return null;
    }
  }

  /**
   * Отзыв access token
   */
  async revokeAccessToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/aas/oauth2/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          token: accessToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      return response.ok;
    } catch (error) {
      this.logger.error(`Ошибка отзыва Госуслуги токена: ${error.message}`);
      return false;
    }
  }

  // Приватные методы

  private async exchangeCodeForToken(code: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/aas/oauth2/te`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Госуслуги token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Госуслуги token exchange error: ${data.error_description}`);
    }

    return data;
  }

  private async getUserData(accessToken: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/rs/prns`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Госуслуги user data: ${response.statusText}`);
    }

    return response.json();
  }

  private async findUserByGosuslugiId(gosuslugiId: string): Promise<any> {
    // Здесь должна быть логика поиска пользователя в БД по Госуслуги ID
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
    this.logger.log(`Обновлены Госуслуги метаданные для пользователя ${userId}`);
  }

  private async createUserFromGosuslugi(
    userData: any,
    metadata: OAuthMetadata,
  ): Promise<any> {
    // Здесь должна быть логика создания нового пользователя в БД
    const newUser = {
      id: this.generateUserId(),
      email: userData.email,
      firstName: userData.name?.split(' ')[0] || userData.firstName || '',
      lastName: userData.name?.split(' ').slice(1).join(' ') || userData.lastName || '',
      avatarUrl: userData.avatar_url,
      gosuslugiId: metadata.providerId,
      gosuslugiVerified: true,
      primaryAuthMethod: AuthMethodType.GOSUSLUGI.toString(),
      availableAuthMethods: [AuthMethodType.GOSUSLUGI.toString()],
      oauthMetadata: metadata,
    };

    this.logger.log(`Создан новый пользователь через Госуслуги: ${newUser.email}`);
    return newUser;
  }

  private async detectConflicts(
    existingUser: any,
    gosuslugiUserData: any,
  ): Promise<any> {
    const conflicts: any = {};

    if (existingUser.email && existingUser.email !== gosuslugiUserData.email) {
      conflicts.email = {
        primary: existingUser.email,
        secondary: gosuslugiUserData.email,
      };
    }

    const gosuslugiFirstName = gosuslugiUserData.name?.split(' ')[0] || gosuslugiUserData.firstName || '';
    if (existingUser.firstName && existingUser.firstName !== gosuslugiFirstName) {
      conflicts.firstName = {
        primary: existingUser.firstName,
        secondary: gosuslugiFirstName,
      };
    }

    const gosuslugiLastName = gosuslugiUserData.name?.split(' ').slice(1).join(' ') || gosuslugiUserData.lastName || '';
    if (existingUser.lastName && existingUser.lastName !== gosuslugiLastName) {
      conflicts.lastName = {
        primary: existingUser.lastName,
        secondary: gosuslugiLastName,
      };
    }

    return conflicts;
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private generateUserId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}
