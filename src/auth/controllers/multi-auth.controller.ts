import { Controller, Post, Get, Body, Query, Param, UseGuards, Req, Res, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { MultiAuthService } from '../services/multi-auth.service';
import { PhoneAuthService } from '../services/phone-auth.service';
import { GitHubAuthService } from '../services/github-auth.service';
import { VKontakteAuthService } from '../services/vkontakte-auth.service';
import { GosuslugiAuthService } from '../services/gosuslugi-auth.service';
import { AuthService } from '../auth.service';
import { AuthMethodType } from '../enums/auth-method-type.enum';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Public } from '../decorators/public.decorator';

@ApiTags('multi-auth')
@Controller('auth/multi')
export class MultiAuthController {
  private readonly logger = new Logger(MultiAuthController.name);

  constructor(
    private multiAuthService: MultiAuthService,
    private phoneAuthService: PhoneAuthService,
    private githubAuthService: GitHubAuthService,
    private vkontakteAuthService: VKontakteAuthService,
    private gosuslugiAuthService: GosuslugiAuthService,
    private authService: AuthService,
  ) {}

  /**
   * Универсальная регистрация через любой метод аутентификации
   */
  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Регистрация через любой метод аутентификации' })
  @ApiResponse({ status: 201, description: 'Пользователь зарегистрирован' })
  @ApiResponse({ status: 409, description: 'Требуется слияние аккаунтов' })
  async register(
    @Body() body: {
      authMethod: AuthMethodType;
      identifier: string;
      password?: string;
      messenger?: 'whatsapp' | 'telegram';
      additionalData?: any;
    },
  ) {
    const { authMethod, identifier, password, messenger, additionalData } = body;

    // Если это телефонная аутентификация, отправляем код
    if (authMethod === AuthMethodType.PHONE_WHATSAPP || authMethod === AuthMethodType.PHONE_TELEGRAM) {
      if (!messenger) {
        return {
          success: false,
          error: 'Необходимо указать мессенджер для телефонной аутентификации',
        };
      }

      // Генерируем код верификации
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Отправляем код через выбранный мессенджер
      const sendResult = await this.phoneAuthService.sendCode(identifier, code, messenger, 'registration');
      
      if (!sendResult.success) {
        return sendResult;
      }

      // Сохраняем код в базе данных для последующей верификации
      // Здесь должен быть вызов MultiAuthService.generateVerificationCode
      
      return {
        success: true,
        requiresVerification: true,
        message: `Код отправлен через ${messenger}`,
      };
    }

    // Для других методов аутентификации
    return this.multiAuthService.register(authMethod, identifier, password, additionalData);
  }

  /**
   * Универсальный вход через любой метод аутентификации
   */
  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Вход через любой метод аутентификации' })
  @ApiResponse({ status: 200, description: 'Успешная авторизация' })
  @ApiResponse({ status: 401, description: 'Неверные credentials' })
  async login(
    @Body() body: {
      authMethod: AuthMethodType;
      identifier: string;
      password?: string;
      verificationCode?: string;
    },
  ) {
    const { authMethod, identifier, password, verificationCode } = body;
    return this.multiAuthService.login(authMethod, identifier, password, verificationCode);
  }

  /**
   * Привязка дополнительного метода аутентификации
   */
  @Post('bind')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Привязка дополнительного метода аутентификации' })
  @ApiResponse({ status: 200, description: 'Метод аутентификации привязан' })
  @ApiResponse({ status: 400, description: 'Ошибка привязки' })
  async bindAuthMethod(
    @Req() req: Request,
    @Body() body: {
      authMethod: AuthMethodType;
      identifier: string;
      verificationCode?: string;
    },
  ) {
    const userId = (req as any).user.userId;
    const { authMethod, identifier, verificationCode } = body;
    
    return this.multiAuthService.bindAuthMethod(userId, authMethod, identifier, verificationCode);
  }

  /**
   * Отвязка метода аутентификации
   */
  @Post('unbind')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отвязка метода аутентификации' })
  @ApiResponse({ status: 200, description: 'Метод аутентификации отвязан' })
  @ApiResponse({ status: 400, description: 'Ошибка отвязки' })
  async unbindAuthMethod(
    @Req() req: Request,
    @Body() body: {
      authMethod: AuthMethodType;
      verificationCode?: string;
    },
  ) {
    const userId = (req as any).user.userId;
    const { authMethod, verificationCode } = body;
    
    return this.multiAuthService.unbindAuthMethod(userId, authMethod, verificationCode);
  }

  /**
   * Слияние аккаунтов
   */
  @Post('merge')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Слияние аккаунтов с разрешением конфликтов' })
  @ApiResponse({ status: 200, description: 'Аккаунты успешно слиты' })
  @ApiResponse({ status: 400, description: 'Ошибка слияния' })
  async mergeAccounts(
    @Body() body: {
      mergeRequestId: string;
      resolution: any; // MergeResolution
    },
  ) {
    const { mergeRequestId, resolution } = body;
    return this.multiAuthService.mergeAccounts(mergeRequestId, resolution);
  }

  /**
   * Настройка многофакторной аутентификации
   */
  @Post('mfa/setup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Настройка многофакторной аутентификации' })
  @ApiResponse({ status: 200, description: 'MFA настроена' })
  async setupMfa(
    @Req() req: Request,
    @Body() body: {
      methods: AuthMethodType[];
      requiredMethods?: number;
    },
  ) {
    const userId = (req as any).user.userId;
    const { methods, requiredMethods = 1 } = body;
    
    return this.multiAuthService.setupMfa(userId, methods, requiredMethods);
  }

  /**
   * Отключение многофакторной аутентификации
   */
  @Post('mfa/disable')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отключение многофакторной аутентификации' })
  @ApiResponse({ status: 200, description: 'MFA отключена' })
  async disableMfa(@Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.multiAuthService.disableMfa(userId);
  }

  /**
   * Получение доступных методов аутентификации
   */
  @Get('methods')
  @Public()
  @ApiOperation({ summary: 'Получение доступных методов аутентификации' })
  @ApiResponse({ status: 200, description: 'Список доступных методов' })
  async getAvailableMethods() {
    return {
      methods: Object.values(AuthMethodType),
      descriptions: {
        [AuthMethodType.EMAIL]: 'Электронная почта',
        [AuthMethodType.PHONE_WHATSAPP]: 'Телефон через WhatsApp',
        [AuthMethodType.PHONE_TELEGRAM]: 'Телефон через Telegram',
        [AuthMethodType.GOSUSLUGI]: 'Госуслуги',
        [AuthMethodType.VKONTAKTE]: 'ВКонтакте',
        [AuthMethodType.GITHUB]: 'GitHub',
      },
    };
  }

  /**
   * Получение предпочтений пользователя по мессенджерам
   */
  @Get('messenger-preferences')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получение предпочтений пользователя по мессенджерам' })
  @ApiResponse({ status: 200, description: 'Предпочтения пользователя' })
  async getMessengerPreferences(@Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.phoneAuthService.getUserMessengerPreferences(userId);
  }

  /**
   * Обновление предпочтений пользователя по мессенджерам
   */
  @Post('messenger-preferences')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновление предпочтений пользователя по мессенджерам' })
  @ApiResponse({ status: 200, description: 'Предпочтения обновлены' })
  async updateMessengerPreferences(
    @Req() req: Request,
    @Body() preferences: {
      whatsapp: boolean;
      telegram: boolean;
      preferred: 'whatsapp' | 'telegram' | null;
    },
  ) {
    const userId = (req as any).user.userId;
    return this.phoneAuthService.updateMessengerPreferences(userId, preferences);
  }

  // Phone authentication endpoints

  /**
   * Отправка кода подтверждения на телефон
   */
  @Post('phone/send-code')
  @Public()
  @ApiOperation({ summary: 'Отправка кода подтверждения на телефон' })
  @ApiResponse({ status: 200, description: 'Код отправлен' })
  @ApiResponse({ status: 400, description: 'Ошибка отправки кода' })
  async sendPhoneCode(
    @Body() body: {
      phoneNumber: string;
      messengerType: 'WHATSAPP' | 'TELEGRAM';
      purpose: 'login' | 'registration' | 'verification';
    },
  ) {
    const { phoneNumber, messengerType, purpose } = body;
    // Генерируем случайный код
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return this.phoneAuthService.sendCode(phoneNumber, code, messengerType.toLowerCase() as 'whatsapp' | 'telegram', purpose);
  }

  /**
   * Проверка кода подтверждения телефона
   */
  @Post('phone/verify')
  @Public()
  @ApiOperation({ summary: 'Проверка кода подтверждения телефона' })
  @ApiResponse({ status: 200, description: 'Код подтвержден' })
  @ApiResponse({ status: 400, description: 'Неверный код' })
  async verifyPhoneCode(
    @Body() body: {
      phoneNumber: string;
      messengerType: 'WHATSAPP' | 'TELEGRAM';
      code: string;
      purpose: 'login' | 'registration' | 'verification';
    },
  ) {
    const { phoneNumber, messengerType, code, purpose } = body;
    return this.phoneAuthService.verifyCode(phoneNumber, messengerType, code, purpose);
  }

  // OAuth endpoints

  /**
   * Получение URL для авторизации через GitHub
   */
  @Get('oauth/github/url')
  @Public()
  @ApiOperation({ summary: 'Получение URL для авторизации через GitHub' })
  @ApiQuery({ name: 'state', required: false, description: 'Состояние для защиты от CSRF' })
  @ApiResponse({ status: 200, description: 'URL для авторизации' })
  @ApiResponse({ status: 400, description: 'OAuth не настроен' })
  async getGitHubAuthUrl(@Query('state') state?: string) {
    try {
      const authUrl = this.githubAuthService.getAuthUrl(state);
      return { url: authUrl };
    } catch (error) {
      this.logger.error(`GitHub OAuth error: ${error.message}`);
      return {
        error: 'GitHub OAuth не настроен',
        message: 'Пожалуйста, создайте OAuth App на https://github.com/settings/developers и добавьте GITHUB_CLIENT_ID в .env',
        helpUrl: 'https://github.com/settings/developers'
      };
    }
  }

  /**
   * Обработка callback от GitHub
   */
  @Get('oauth/github/callback')
  @Public()
  @ApiOperation({ summary: 'Обработка callback от GitHub' })
  @ApiQuery({ name: 'code', description: 'Код авторизации' })
  @ApiQuery({ name: 'state', required: false, description: 'Состояние' })
  async handleGitHubCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('bind') bind: string,
    @Query('userId') userId: string,
    @Res() res: Response,
  ) {
    this.logger.log(`GitHub OAuth callback received: code=${code?.substring(0, 10)}..., state=${state}, bind=${bind}, userId=${userId}`);
    
    try {
      const result = await this.githubAuthService.handleCallback(code, state);
      
      this.logger.log(`GitHub OAuth callback result: success=${result.success}, user=${result.user?.email || 'none'}`);
      
      if (result.success) {
        // If this is a binding request (bind=true), we need to merge accounts
        if (bind === 'true' && userId) {
          this.logger.log(`GitHub binding request for user ${userId}`);
          
          // Check if GitHub account is already linked to another user
          // If yes, show merge conflict resolution UI
          // For now, just add GitHub to current user's available methods
          const currentUser = await this.multiAuthService['usersRepo'].findOne({ where: { id: userId } });
          if (currentUser && !currentUser.availableAuthMethods.includes('GITHUB')) {
            currentUser.availableAuthMethods.push('GITHUB');
            currentUser.githubId = result.user.githubId;
            currentUser.githubUsername = result.user.githubUsername;
            currentUser.githubVerified = true;
            await this.multiAuthService['usersRepo'].save(currentUser);
            this.logger.log(`GitHub added to user ${userId} available methods`);
          }
          
          // Redirect to dashboard with existing session
          const frontendUrl = process.env.FRONTEND_URL || 'https://vselena.ldmco.ru';
          const redirectUrl = `${frontendUrl}/dashboard.html`;
          this.logger.log(`GitHub OAuth binding redirecting to: ${redirectUrl}`);
          return res.redirect(redirectUrl);
        }
        
        // Генерируем JWT токены для пользователя через AuthService
        const accessToken = await this.authService.generateAccessToken(result.user);
        const refreshToken = await this.authService.generateRefreshToken(result.user);
        
        this.logger.log(`GitHub OAuth tokens generated: accessToken=${accessToken.substring(0, 20)}..., refreshToken=${refreshToken.substring(0, 20)}...`);
        
        // Перенаправляем на dashboard с токенами
        const frontendUrl = process.env.FRONTEND_URL || 'https://vselena.ldmco.ru';
        const redirectUrl = `${frontendUrl}/dashboard.html?token=${accessToken}&refreshToken=${refreshToken}`;
        this.logger.log(`GitHub OAuth redirecting to: ${redirectUrl}`);
        return res.redirect(redirectUrl);
      } else {
        this.logger.error(`GitHub OAuth failed: ${result.error}`);
        // Перенаправляем на главную с ошибкой
        const frontendUrl = process.env.FRONTEND_URL || 'https://vselena.ldmco.ru';
        const redirectUrl = `${frontendUrl}/index.html?error=${encodeURIComponent(result.error || 'Unknown error')}`;
        this.logger.log(`GitHub OAuth redirecting to error page: ${redirectUrl}`);
        return res.redirect(redirectUrl);
      }
    } catch (error) {
      this.logger.error(`GitHub OAuth callback error: ${error.message}`);
      this.logger.error(error.stack);
      const frontendUrl = process.env.FRONTEND_URL || 'https://vselena.ldmco.ru';
      const redirectUrl = `${frontendUrl}/index.html?error=${encodeURIComponent(error.message || 'Unknown error')}`;
      this.logger.log(`GitHub OAuth redirecting to error page: ${redirectUrl}`);
      return res.redirect(redirectUrl);
    }
  }

  /**
   * Получение URL для авторизации через VKontakte
   */
  @Get('oauth/vkontakte')
  @Public()
  @ApiOperation({ summary: 'Получение URL для авторизации через VKontakte' })
  @ApiQuery({ name: 'state', required: false, description: 'Состояние для защиты от CSRF' })
  @ApiResponse({ status: 200, description: 'URL для авторизации' })
  async getVKontakteAuthUrl(@Query('state') state?: string) {
    const authUrl = this.vkontakteAuthService.getAuthUrl(state);
    return { authUrl };
  }

  /**
   * Обработка callback от VKontakte
   */
  @Get('oauth/vkontakte/callback')
  @Public()
  @ApiOperation({ summary: 'Обработка callback от VKontakte' })
  @ApiQuery({ name: 'code', description: 'Код авторизации' })
  @ApiQuery({ name: 'state', required: false, description: 'Состояние' })
  async handleVKontakteCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const result = await this.vkontakteAuthService.handleCallback(code, state);
    
    if (result.success) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth/success?token=${result.accessToken}&refreshToken=${result.refreshToken}`;
      return res.redirect(redirectUrl);
    } else {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth/error?error=${encodeURIComponent(result.error || 'Unknown error')}`;
      return res.redirect(redirectUrl);
    }
  }

  /**
   * Получение URL для авторизации через Госуслуги
   */
  @Get('oauth/gosuslugi')
  @Public()
  @ApiOperation({ summary: 'Получение URL для авторизации через Госуслуги' })
  @ApiQuery({ name: 'state', required: false, description: 'Состояние для защиты от CSRF' })
  @ApiResponse({ status: 200, description: 'URL для авторизации' })
  async getGosuslugiAuthUrl(@Query('state') state?: string) {
    const authUrl = this.gosuslugiAuthService.getAuthUrl(state);
    return { authUrl };
  }

  /**
   * Обработка callback от Госуслуг
   */
  @Get('oauth/gosuslugi/callback')
  @Public()
  @ApiOperation({ summary: 'Обработка callback от Госуслуг' })
  @ApiQuery({ name: 'code', description: 'Код авторизации' })
  @ApiQuery({ name: 'state', required: false, description: 'Состояние' })
  async handleGosuslugiCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const result = await this.gosuslugiAuthService.handleCallback(code, state);
    
    if (result.success) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth/success?token=${result.accessToken}&refreshToken=${result.refreshToken}`;
      return res.redirect(redirectUrl);
    } else {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth/error?error=${encodeURIComponent(result.error || 'Unknown error')}`;
      return res.redirect(redirectUrl);
    }
  }

  /**
   * Обработка Telegram Login Widget
   */
  @Post('telegram-login')
  @Public()
  @ApiOperation({ summary: 'Обработка Telegram Login Widget' })
  async handleTelegramLogin(@Body() telegramUser: any) {
    const { id, first_name, last_name, username, photo_url, auth_date, hash } = telegramUser;
    
    this.logger.log(`Telegram Login: ${username || first_name} (${id})`);
    
    // Проверяем hash для безопасности
    // TODO: Добавить проверку hash
    
    // Находим или создаём пользователя
    const user = await this.multiAuthService.handleTelegramLogin(telegramUser);
    
    if (user) {
      // Генерируем токены
      const tokens = await this.generateTokens(user);
      
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: user,
      };
    } else {
      throw new Error('Не удалось авторизовать пользователя');
    }
  }

  private async generateTokens(user: any) {
    // Генерация токенов аналогично AuthService
    const accessToken = await this.multiAuthService.generateAccessToken(user);
    const refreshToken = await this.multiAuthService.generateRefreshToken(user);
    
    return { accessToken, refreshToken };
  }
}