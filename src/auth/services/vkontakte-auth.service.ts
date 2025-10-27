import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthMethodType } from '../enums/auth-method-type.enum';
import { OAuthCallbackResult, OAuthMetadata } from '../interfaces/multi-auth.interface';

@Injectable()
export class VKontakteAuthService {
  private readonly logger = new Logger(VKontakteAuthService.name);
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly redirectUri: string;

  constructor(private configService: ConfigService) {
    this.appId = this.configService.get<string>('VKONTAKTE_APP_ID') || '';
    this.appSecret = this.configService.get<string>('VKONTAKTE_APP_SECRET') || '';
    this.redirectUri = this.configService.get<string>('VKONTAKTE_REDIRECT_URI') || 'http://localhost:3001/api/auth/multi/oauth/vkontakte/callback';
  }

  /**
   * Получение URL для авторизации через VKontakte
   */
  getAuthUrl(state?: string): string {
    if (!this.appId) {
      this.logger.error('❌ VKontakte OAuth не настроен! Пожалуйста, создайте приложение на https://dev.vk.com/');
      throw new Error('VKontakte OAuth не настроен. Создайте приложение на https://dev.vk.com/ и добавьте VKONTAKTE_APP_ID в .env');
    }

    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      scope: 'email',
      response_type: 'code',
      v: '5.131', // Версия API
      state: state || this.generateState(),
    });

    return `https://oauth.vk.com/authorize?${params.toString()}`;
  }

  /**
   * Обработка callback от VKontakte
   */
  async handleCallback(
    code: string,
    state?: string,
  ): Promise<OAuthCallbackResult> {
    try {
      // Обмениваем код на access token
      const tokenData = await this.exchangeCodeForToken(code);
      
      // Получаем данные пользователя
      const userData = await this.getUserData(tokenData.access_token, tokenData.user_id);
      
      // Формируем метаданные
      const metadata: OAuthMetadata = {
        provider: 'vkontakte',
        providerId: userData.id.toString(),
        username: userData.screen_name || userData.id.toString(),
        avatarUrl: userData.photo_200 || userData.photo_100,
        profileUrl: `https://vk.com/id${userData.id}`,
        accessToken: tokenData.access_token,
        scopes: ['email'],
      };

      // Проверяем, есть ли пользователь с таким VK ID
      const existingUser = await this.findUserByVKId(userData.id.toString());
      
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
      if (tokenData.email) {
        const userByEmail = await this.findUserByEmail(tokenData.email);
        
        if (userByEmail) {
          // Нужно слияние аккаунтов
          const conflicts = await this.detectConflicts(userByEmail, userData, tokenData.email);
          
          return {
            success: false,
            requiresMerge: true,
            conflicts,
          };
        }
      }

      // Создаем нового пользователя
      const newUser = await this.createUserFromVK(userData, tokenData.email, metadata);
      
      return {
        success: true,
        user: newUser,
        // Здесь должны быть сгенерированы accessToken и refreshToken
      };

    } catch (error) {
      this.logger.error(`Ошибка обработки VKontakte callback: ${error.message}`);
      return {
        success: false,
        error: 'Ошибка авторизации через VKontakte',
      };
    }
  }

  /**
   * Обновление access token
   */
  async refreshAccessToken(refreshToken: string): Promise<string | null> {
    // VKontakte не предоставляет refresh token в стандартном OAuth 2.0 flow
    // Токены VKontakte не истекают, но могут быть отозваны пользователем
    try {
      const response = await fetch(`https://api.vk.com/method/users.get?access_token=${refreshToken}&v=5.131`);
      const data = await response.json();

      if (data.error) {
        return null; // Токен недействителен
      }

      return refreshToken; // Токен все еще валиден
    } catch (error) {
      this.logger.error(`Ошибка проверки VKontakte токена: ${error.message}`);
      return null;
    }
  }

  /**
   * Отзыв access token
   */
  async revokeAccessToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`https://api.vk.com/method/auth.revokeToken?access_token=${accessToken}&v=5.131`);
      const data = await response.json();

      return !data.error;
    } catch (error) {
      this.logger.error(`Ошибка отзыва VKontakte токена: ${error.message}`);
      return false;
    }
  }

  // Приватные методы

  private async exchangeCodeForToken(code: string): Promise<any> {
    const response = await fetch('https://oauth.vk.com/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.appId,
        client_secret: this.appSecret,
        redirect_uri: this.redirectUri,
        code,
      }),
    });

    if (!response.ok) {
      throw new Error(`VKontakte token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`VKontakte token exchange error: ${data.error_description}`);
    }

    return data;
  }

  private async getUserData(accessToken: string, userId: string): Promise<any> {
    const response = await fetch(`https://api.vk.com/method/users.get?access_token=${accessToken}&user_ids=${userId}&fields=photo_200,photo_100,screen_name&v=5.131`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch VKontakte user data: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`VKontakte API error: ${data.error.error_msg}`);
    }

    return data.response[0];
  }

  private async findUserByVKId(vkId: string): Promise<any> {
    // Здесь должна быть логика поиска пользователя в БД по VK ID
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
    this.logger.log(`Обновлены VKontakte метаданные для пользователя ${userId}`);
  }

  private async createUserFromVK(
    userData: any,
    email: string,
    metadata: OAuthMetadata,
  ): Promise<any> {
    // Здесь должна быть логика создания нового пользователя в БД
    const newUser = {
      id: this.generateUserId(),
      email: email,
      firstName: userData.first_name || '',
      lastName: userData.last_name || '',
      avatarUrl: userData.photo_200 || userData.photo_100,
      vkontakteId: userData.id.toString(),
      vkontakteVerified: true,
      primaryAuthMethod: AuthMethodType.VKONTAKTE.toString(),
      availableAuthMethods: [AuthMethodType.VKONTAKTE.toString()],
      oauthMetadata: metadata,
    };

    this.logger.log(`Создан новый пользователь через VKontakte: ${newUser.email}`);
    return newUser;
  }

  private async detectConflicts(
    existingUser: any,
    vkUserData: any,
    email: string,
  ): Promise<any> {
    const conflicts: any = {};

    if (existingUser.email && existingUser.email !== email) {
      conflicts.email = {
        primary: existingUser.email,
        secondary: email,
      };
    }

    if (existingUser.firstName && existingUser.firstName !== vkUserData.first_name) {
      conflicts.firstName = {
        primary: existingUser.firstName,
        secondary: vkUserData.first_name || '',
      };
    }

    if (existingUser.lastName && existingUser.lastName !== vkUserData.last_name) {
      conflicts.lastName = {
        primary: existingUser.lastName,
        secondary: vkUserData.last_name || '',
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
