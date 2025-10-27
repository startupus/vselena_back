import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { VerificationCode } from '../entities/verification-code.entity';
import { AccountMergeRequest } from '../entities/account-merge-request.entity';
import { AuthMethodType } from '../enums/auth-method-type.enum';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../auth.service';
import {
  AuthResult,
  VerificationCodeData,
  AccountMergeRequestData,
  MergeConflicts,
  MergeResolution,
  SystemAuthSettings,
  MfaSettings,
} from '../interfaces/multi-auth.interface';

@Injectable()
export class MultiAuthService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(VerificationCode)
    private verificationCodesRepo: Repository<VerificationCode>,
    @InjectRepository(AccountMergeRequest)
    private mergeRequestsRepo: Repository<AccountMergeRequest>,
    private usersService: UsersService,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
  ) {}

  /**
   * Универсальная регистрация через любой метод аутентификации
   */
  async register(
    authMethod: AuthMethodType,
    identifier: string,
    password?: string,
    additionalData?: any,
  ): Promise<AuthResult> {
    // Проверяем, существует ли пользователь с таким идентификатором
    const existingUser = await this.findUserByIdentifier(authMethod, identifier);
    
    if (existingUser) {
      // Если пользователь существует, проверяем, нужно ли слияние аккаунтов
      const conflicts = await this.detectConflicts(existingUser, authMethod, identifier, additionalData);
      
      if (Object.keys(conflicts).length > 0) {
        // Создаем запрос на слияние аккаунтов
        const mergeRequest = await this.createMergeRequest(existingUser.id, authMethod, identifier, conflicts);
        
        return {
          success: false,
          requiresMerge: true,
          mergeRequestId: mergeRequest.id,
          conflicts,
        };
      }
      
      // Если конфликтов нет, просто возвращаем существующего пользователя
      return {
        success: true,
        user: existingUser,
      };
    }

    // Создаем нового пользователя
    const newUser = await this.createUser(authMethod, identifier, password, additionalData);
    
    // Генерируем код верификации, если требуется
    if (this.requiresVerification(authMethod)) {
      const verificationCode = await this.generateVerificationCode(
        authMethod,
        identifier,
        'registration',
        additionalData,
      );
      
      return {
        success: true,
        user: newUser,
        requiresVerification: true,
        verificationCode: verificationCode.code,
      };
    }

    return {
      success: true,
      user: newUser,
    };
  }

  /**
   * Универсальный вход через любой метод аутентификации
   */
  async login(
    authMethod: AuthMethodType,
    identifier: string,
    password?: string,
    verificationCode?: string,
  ): Promise<AuthResult> {
    const user = await this.findUserByIdentifier(authMethod, identifier);
    
    if (!user) {
      return {
        success: false,
        error: 'Пользователь не найден',
      };
    }

    // Проверяем пароль, если требуется
    if (password && authMethod === AuthMethodType.EMAIL) {
      // Здесь должна быть проверка пароля через bcrypt
      // const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      // if (!isValidPassword) {
      //   return { success: false, error: 'Неверный пароль' };
      // }
    }

    // Проверяем код верификации, если требуется
    if (verificationCode) {
      const isValidCode = await this.verifyCode(verificationCode, identifier, authMethod, 'login');
      if (!isValidCode) {
        return {
          success: false,
          error: 'Неверный код верификации',
        };
      }
    }

    // Проверяем MFA, если настроено
    if (user.mfaSettings?.enabled) {
      // Здесь должна быть логика проверки MFA
      // Пока возвращаем успех
    }

    return {
      success: true,
      user,
      // Здесь должны быть сгенерированы accessToken и refreshToken
    };
  }

  /**
   * Привязка дополнительного метода аутентификации к существующему аккаунту
   */
  async bindAuthMethod(
    userId: string,
    authMethod: AuthMethodType,
    identifier: string,
    verificationCode?: string,
  ): Promise<AuthResult> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      return {
        success: false,
        error: 'Пользователь не найден',
      };
    }

    // Проверяем, не привязан ли уже этот метод
    if (this.isAuthMethodBound(user, authMethod)) {
      return {
        success: false,
        error: 'Этот метод аутентификации уже привязан',
      };
    }

    // Проверяем код верификации, если требуется
    if (verificationCode) {
      const isValidCode = await this.verifyCode(verificationCode, identifier, authMethod, 'binding');
      if (!isValidCode) {
        return {
          success: false,
          error: 'Неверный код верификации',
        };
      }
    }

    // Привязываем метод аутентификации
    await this.bindAuthMethodToUser(user, authMethod, identifier);

    return {
      success: true,
      user,
    };
  }

  /**
   * Отвязка метода аутентификации от аккаунта
   */
  async unbindAuthMethod(
    userId: string,
    authMethod: AuthMethodType,
    verificationCode?: string,
  ): Promise<AuthResult> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      return {
        success: false,
        error: 'Пользователь не найден',
      };
    }

    // Проверяем, что у пользователя есть другие методы аутентификации
    const availableMethods = user.availableAuthMethods || [];
    if (availableMethods.length <= 1) {
      return {
        success: false,
        error: 'Нельзя отвязать последний метод аутентификации',
      };
    }

    // Проверяем код верификации, если требуется
    if (verificationCode) {
      const identifier = this.getUserIdentifier(user, authMethod);
      if (identifier) {
        const isValidCode = await this.verifyCode(verificationCode, identifier, authMethod, 'unbinding');
        if (!isValidCode) {
          return {
            success: false,
            error: 'Неверный код верификации',
          };
        }
      }
    }

    // Отвязываем метод аутентификации
    await this.unbindAuthMethodFromUser(user, authMethod);

    return {
      success: true,
      user,
    };
  }

  /**
   * Слияние аккаунтов с разрешением конфликтов
   */
  async mergeAccounts(
    mergeRequestId: string,
    resolution: MergeResolution,
  ): Promise<AuthResult> {
    const mergeRequest = await this.mergeRequestsRepo.findOne({
      where: { id: mergeRequestId },
      relations: ['primaryUser', 'secondaryUser'],
    });

    if (!mergeRequest) {
      return {
        success: false,
        error: 'Запрос на слияние не найден',
      };
    }

    if (mergeRequest.status !== 'pending') {
      return {
        success: false,
        error: 'Запрос на слияние уже обработан',
      };
    }

    // Выполняем слияние согласно разрешению конфликтов
    const mergedUser = await this.performAccountMerge(mergeRequest, resolution);

    // Обновляем статус запроса
    mergeRequest.status = 'resolved';
    mergeRequest.resolution = resolution;
    mergeRequest.resolvedAt = new Date();
    await this.mergeRequestsRepo.save(mergeRequest);

    return {
      success: true,
      user: mergedUser,
    };
  }

  /**
   * Настройка многофакторной аутентификации
   */
  async setupMfa(
    userId: string,
    methods: AuthMethodType[],
    requiredMethods: number = 1,
  ): Promise<MfaSettings> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Генерируем резервные коды
    const backupCodes = this.generateBackupCodes();

    const mfaSettings: MfaSettings = {
      enabled: true,
      methods: methods.map(m => m.toString()),
      backupCodes,
      backupCodesUsed: [],
      requiredMethods,
    };

    user.mfaSettings = mfaSettings;
    await this.usersRepo.save(user);

    return mfaSettings;
  }

  /**
   * Отключение многофакторной аутентификации
   */
  async disableMfa(userId: string): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    user.mfaSettings = {
      enabled: false,
      methods: [],
      backupCodes: [],
      backupCodesUsed: [],
      requiredMethods: 0,
    };

    await this.usersRepo.save(user);
  }

  // Приватные методы

  private async findUserByIdentifier(
    authMethod: AuthMethodType,
    identifier: string,
  ): Promise<User | null> {
    const whereCondition: any = {};

    switch (authMethod) {
      case AuthMethodType.EMAIL:
        whereCondition.email = identifier;
        break;
      case AuthMethodType.PHONE_WHATSAPP:
      case AuthMethodType.PHONE_TELEGRAM:
        whereCondition.phone = identifier;
        break;
      case AuthMethodType.GITHUB:
        whereCondition.githubId = identifier;
        break;
      case AuthMethodType.GOSUSLUGI:
        whereCondition.gosuslugiId = identifier;
        break;
      case AuthMethodType.VKONTAKTE:
        whereCondition.vkontakteId = identifier;
        break;
    }

    return this.usersRepo.findOne({ where: whereCondition });
  }

  private async createUser(
    authMethod: AuthMethodType,
    identifier: string,
    password?: string,
    additionalData?: any,
  ): Promise<User> {
    const user = this.usersRepo.create({
      primaryAuthMethod: authMethod,
      availableAuthMethods: [authMethod],
    });

    // Заполняем поля в зависимости от метода аутентификации
    switch (authMethod) {
      case AuthMethodType.EMAIL:
        user.email = identifier;
        if (password) {
          // user.passwordHash = await bcrypt.hash(password, 12);
        }
        break;
      case AuthMethodType.PHONE_WHATSAPP:
      case AuthMethodType.PHONE_TELEGRAM:
        user.phone = identifier;
        user.phoneVerified = false;
        break;
      case AuthMethodType.GITHUB:
        user.githubId = identifier;
        user.githubUsername = additionalData?.username;
        user.githubVerified = true;
        break;
      case AuthMethodType.GOSUSLUGI:
        user.gosuslugiId = identifier;
        user.gosuslugiVerified = true;
        break;
      case AuthMethodType.VKONTAKTE:
        user.vkontakteId = identifier;
        user.vkontakteVerified = true;
        break;
    }

    return this.usersRepo.save(user);
  }

  private async generateVerificationCode(
    authMethod: AuthMethodType,
    identifier: string,
    purpose: string,
    metadata?: any,
  ): Promise<VerificationCode> {
    const code = this.generateRandomCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Код действует 10 минут

    const verificationCode = this.verificationCodesRepo.create({
      code,
      identifier,
      authMethod,
      purpose,
      expiresAt,
      metadata,
    });

    return this.verificationCodesRepo.save(verificationCode);
  }

  private async verifyCode(
    code: string,
    identifier: string,
    authMethod: AuthMethodType,
    purpose: string,
  ): Promise<boolean> {
    const verificationCode = await this.verificationCodesRepo.findOne({
      where: {
        code,
        identifier,
        authMethod,
        purpose,
        isUsed: false,
      },
    });

    if (!verificationCode) {
      return false;
    }

    if (verificationCode.expiresAt < new Date()) {
      return false;
    }

    // Помечаем код как использованный
    verificationCode.isUsed = true;
    await this.verificationCodesRepo.save(verificationCode);

    return true;
  }

  private async detectConflicts(
    existingUser: User,
    authMethod: AuthMethodType,
    identifier: string,
    additionalData?: any,
  ): Promise<MergeConflicts> {
    const conflicts: MergeConflicts = {};

    // Проверяем конфликты в зависимости от метода аутентификации
    switch (authMethod) {
      case AuthMethodType.EMAIL:
        if (existingUser.email && existingUser.email !== identifier) {
          conflicts.email = {
            primary: existingUser.email,
            secondary: identifier,
          };
        }
        break;
      case AuthMethodType.PHONE_WHATSAPP:
      case AuthMethodType.PHONE_TELEGRAM:
        if (existingUser.phone && existingUser.phone !== identifier) {
          conflicts.phone = {
            primary: existingUser.phone,
            secondary: identifier,
          };
        }
        break;
    }

    return conflicts;
  }

  private async createMergeRequest(
    primaryUserId: string,
    authMethod: AuthMethodType,
    identifier: string,
    conflicts: MergeConflicts,
  ): Promise<AccountMergeRequest> {
    const mergeRequest = this.mergeRequestsRepo.create({
      primaryUserId,
      secondaryUserId: primaryUserId, // Временно, пока не создан вторичный пользователь
      authMethod: authMethod.toString(),
      conflicts,
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 часа
    });

    return this.mergeRequestsRepo.save(mergeRequest);
  }

  private async performAccountMerge(
    mergeRequest: AccountMergeRequest,
    resolution: MergeResolution,
  ): Promise<User> {
    // Здесь должна быть логика слияния аккаунтов
    // Пока возвращаем основного пользователя
    return mergeRequest.primaryUser;
  }

  private isAuthMethodBound(user: User, authMethod: AuthMethodType): boolean {
    const availableMethods = user.availableAuthMethods || [];
    return availableMethods.includes(authMethod);
  }

  private async bindAuthMethodToUser(
    user: User,
    authMethod: AuthMethodType,
    identifier: string,
  ): Promise<void> {
    const availableMethods = user.availableAuthMethods || [];
    if (!availableMethods.includes(authMethod)) {
      availableMethods.push(authMethod);
      user.availableAuthMethods = availableMethods;
    }

    // Обновляем соответствующие поля
    switch (authMethod) {
      case AuthMethodType.EMAIL:
        user.email = identifier;
        break;
      case AuthMethodType.PHONE_WHATSAPP:
      case AuthMethodType.PHONE_TELEGRAM:
        user.phone = identifier;
        user.phoneVerified = true;
        break;
      case AuthMethodType.GITHUB:
        user.githubId = identifier;
        user.githubVerified = true;
        break;
      case AuthMethodType.GOSUSLUGI:
        user.gosuslugiId = identifier;
        user.gosuslugiVerified = true;
        break;
      case AuthMethodType.VKONTAKTE:
        user.vkontakteId = identifier;
        user.vkontakteVerified = true;
        break;
    }

    await this.usersRepo.save(user);
  }

  private async unbindAuthMethodFromUser(
    user: User,
    authMethod: AuthMethodType,
  ): Promise<void> {
    const availableMethods = user.availableAuthMethods || [];
    const filteredMethods = availableMethods.filter(m => m !== authMethod.toString());
    user.availableAuthMethods = filteredMethods;

    // Очищаем соответствующие поля
    switch (authMethod) {
      case AuthMethodType.EMAIL:
        user.email = null;
        break;
      case AuthMethodType.PHONE_WHATSAPP:
      case AuthMethodType.PHONE_TELEGRAM:
        user.phone = null;
        user.phoneVerified = false;
        break;
      case AuthMethodType.GITHUB:
        user.githubId = null;
        user.githubVerified = false;
        break;
      case AuthMethodType.GOSUSLUGI:
        user.gosuslugiId = null;
        user.gosuslugiVerified = false;
        break;
      case AuthMethodType.VKONTAKTE:
        user.vkontakteId = null;
        user.vkontakteVerified = false;
        break;
    }

    await this.usersRepo.save(user);
  }

  private getUserIdentifier(user: User, authMethod: AuthMethodType): string | null {
    switch (authMethod) {
      case AuthMethodType.EMAIL:
        return user.email;
      case AuthMethodType.PHONE_WHATSAPP:
      case AuthMethodType.PHONE_TELEGRAM:
        return user.phone;
      case AuthMethodType.GITHUB:
        return user.githubId;
      case AuthMethodType.GOSUSLUGI:
        return user.gosuslugiId;
      case AuthMethodType.VKONTAKTE:
        return user.vkontakteId;
      default:
        return null;
    }
  }

  private requiresVerification(authMethod: AuthMethodType): boolean {
    return [
      AuthMethodType.PHONE_WHATSAPP,
      AuthMethodType.PHONE_TELEGRAM,
    ].includes(authMethod);
  }

  private generateRandomCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }

  /**
   * Обработка Telegram Login Widget
   */
  async handleTelegramLogin(telegramUser: any): Promise<any> {
    const { id, first_name, last_name, username, photo_url, auth_date, hash } = telegramUser;
    
    // Проверяем hash (безопасность)
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new Error('Telegram Bot Token не настроен');
    }
    
    // TODO: Реализовать проверку hash
    
    const email = username ? `${username}@telegram.local` : `telegram_${id}@local`;
    
    // Ищем пользователя по email
    let user = await this.usersService.findByEmail(email);
    
    if (!user) {
      // Создаём нового пользователя
      user = await this.usersService.create({
        email,
        firstName: first_name || '',
        lastName: last_name || '',
        avatarUrl: photo_url || '',
        passwordHash: null,
        isActive: true,
        emailVerified: true,
        primaryAuthMethod: AuthMethodType.PHONE_TELEGRAM,
        availableAuthMethods: [AuthMethodType.PHONE_TELEGRAM],
        messengerMetadata: {
          telegram: {
            userId: id.toString(),
            username: username || '',
          }
        }
      });
    }
    
    return user;
  }

  /**
   * Генерация Access Token
   */
  async generateAccessToken(user: any): Promise<string> {
    // Используем AuthService для генерации токена
    return this.authService.generateAccessToken(user);
  }

  /**
   * Генерация Refresh Token
   */
  async generateRefreshToken(user: any): Promise<string> {
    // Используем AuthService для генерации refresh токена
    return this.authService.generateRefreshToken(user);
  }
}