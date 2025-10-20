import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { TwoFactorCode, TwoFactorStatus, TwoFactorType } from './entities/two-factor-code.entity';
import { Role } from '../rbac/entities/role.entity';
import { UsersService } from '../users/users.service';
import { RbacService } from '../rbac/rbac.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { SmartAuthDto, SmartAuthResponseDto } from './dto/smart-auth.dto';
import { BindPhoneDto, VerifyPhoneDto, BindPhoneResponseDto } from './dto/bind-phone.dto';
import { SendEmailVerificationDto, VerifyEmailDto, EmailVerificationResponseDto } from './dto/email-verification.dto';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { EmailService } from './email.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { ReferralsService } from './micro-modules/referrals/referrals.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private rbacService: RbacService,
    private referralsService: ReferralsService,
    @InjectRepository(RefreshToken)
    private refreshTokensRepo: Repository<RefreshToken>,
    @InjectRepository(TwoFactorCode)
    private twoFactorCodesRepo: Repository<TwoFactorCode>,
    @InjectRepository(Role)
    private rolesRepo: Repository<Role>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(EmailVerificationToken)
    private emailVerificationTokensRepo: Repository<EmailVerificationToken>,
    private emailService: EmailService,
  ) {}

  /**
   * Регистрация нового пользователя
   * Первый пользователь становится super_admin, остальные - viewer
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // 1. Проверка уникальности email
    const exists = await this.usersService.findByEmail(dto.email);
    if (exists) {
      throw new ConflictException('Email уже используется');
    }

    // 2. Проверяем, есть ли уже пользователи в системе
    const userCount = await this.usersService.getUserCount();
    const isFirstUser = userCount === 0;

    // 3. Хеширование пароля
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // 4. Создание пользователя
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      organizationId: dto.organizationId,
      teamId: dto.teamId,
    });

    // 5. Назначение роли - все пользователи становятся viewer
    // Роли могут быть повышены только супер-админом или по специальным условиям
    try {
      const viewerRole = await this.rolesRepo.findOne({ where: { name: 'viewer' } });
      if (viewerRole) {
        // Прямое назначение роли через TypeORM (обходим проверку организации)
        await this.usersRepo
          .createQueryBuilder()
          .relation(User, 'roles')
          .of(user.id)
          .add(viewerRole.id);
        console.log('👤 Пользователь зарегистрирован как viewer');
      } else {
        console.log('⚠️ Роль viewer не найдена, пользователь создан без роли');
      }
    } catch (error) {
      console.log('⚠️ Ошибка назначения роли viewer:', error.message);
    }

    // Загружаем пользователя с ролями для генерации токенов
    const userWithRoles = await this.usersService.findByEmail(user.email, {
      relations: ['roles', 'roles.permissions', 'organization', 'team'],
    });

    if (!userWithRoles) {
      throw new Error('Пользователь не найден после регистрации');
    }

    // Генерируем токены для автоматического входа
    const accessToken = await this.generateAccessToken(userWithRoles as User);
    const refreshToken = await this.generateRefreshToken(userWithRoles as User);

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(userWithRoles as User),
    };
  }

  /**
   * Вход в систему
   */
  async login(dto: LoginDto): Promise<AuthResponseDto | { requires2FA: true; message: string; userId: string }> {
    // 1. Валидация credentials
    const user = await this.validateUser(dto.email, dto.password);

    // 2. Проверяем, включен ли 2FA
    if (user.twoFactorEnabled) {
      return {
        requires2FA: true,
        message: 'Требуется двухфакторная аутентификация',
        userId: user.id,
      };
    }

    // 3. Генерация токенов
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    // 4. Возврат данных
    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Завершение входа с 2FA
   */
  async complete2FALogin(userId: string, code: string): Promise<AuthResponseDto> {
    // Находим пользователя
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    if (!user.twoFactorEnabled) {
      throw new UnauthorizedException('2FA не включен для этого пользователя');
    }

    // Загружаем роли и права пользователя
    const userWithRoles = await this.usersService.findById(userId);
    if (!userWithRoles) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    // Проверяем 2FA код через простую проверку
    const twoFactorCode = await this.twoFactorCodesRepo.findOne({
      where: {
        contact: user.email,
        code: code,
        expiresAt: MoreThan(new Date()),
        status: TwoFactorStatus.PENDING,
      },
    });

    if (!twoFactorCode) {
      throw new BadRequestException('Неверный или истёкший 2FA код');
    }

    // Помечаем код как использованный
    await this.twoFactorCodesRepo.update(twoFactorCode.id, { 
      status: TwoFactorStatus.USED,
      verifiedAt: new Date()
    });

    // Генерируем токены
    const accessToken = await this.generateAccessToken(userWithRoles);
    const refreshToken = await this.generateRefreshToken(userWithRoles);

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(userWithRoles),
    };
  }

  /**
   * Валидация пользователя и пароля
   */
  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email, {
      select: ['id', 'email', 'passwordHash', 'isActive', 'emailVerified', 'organizationId', 'teamId', 'twoFactorEnabled'],
      relations: ['roles', 'roles.permissions', 'organization', 'team'],
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    console.log('🔍 User roles:', user.roles?.length || 0);
    console.log('🔍 User permissions:', user.roles?.flatMap(r => r.permissions)?.length || 0);

    if (!user.isActive) {
      throw new UnauthorizedException('Аккаунт деактивирован');
    }

    // Сравнение паролей
    if (!user.passwordHash) {
      throw new UnauthorizedException('Пользователь не имеет пароля');
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный пароль');
    }

    return user;
  }

  /**
   * Генерация Access Token (JWT)
   */
  async generateAccessToken(user: User): Promise<string> {
    const permissions = this.extractPermissions(user.roles || []);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId || null,
      teamId: user.teamId || null,
      roles: (user.roles || []).map(r => r.name),
      permissions,
    };

    return this.jwtService.sign(payload, {
      expiresIn: '15m',
    });
  }

  /**
   * Генерация Refresh Token (UUID + сохранение в БД)
   */
  async generateRefreshToken(user: User): Promise<string> {
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // +7 дней

    await this.refreshTokensRepo.save({
      token,
      userId: user.id,
      expiresAt,
      isRevoked: false,
    });

    return token;
  }

  /**
   * Обновление Access Token через Refresh Token
   */
  async refreshAccessToken(refreshToken: string): Promise<string> {
    const tokenRecord = await this.refreshTokensRepo.findOne({
      where: { token: refreshToken },
      relations: ['user', 'user.roles', 'user.roles.permissions'],
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Невалидный refresh token');
    }

    if (tokenRecord.isRevoked) {
      throw new UnauthorizedException('Refresh token отозван');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token истёк');
    }

    // Если у пользователя включен 2FA, требуем повторную аутентификацию
    if (tokenRecord.user.twoFactorEnabled) {
      throw new UnauthorizedException('Требуется повторная аутентификация с 2FA');
    }

    // Генерация нового Access Token
    return this.generateAccessToken(tokenRecord.user);
  }

  /**
   * Выход из системы (отзыв Refresh Token)
   */
  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokensRepo.update(
      { token: refreshToken },
      { isRevoked: true }
    );
  }

  /**
   * Извлечение всех permissions из ролей пользователя
   */
  private extractPermissions(roles: any[]): string[] {
    const permissions = new Set<string>();
    
    roles.forEach(role => {
      if (role.permissions) {
        role.permissions.forEach(perm => {
          permissions.add(perm.name);
        });
      }
    });

    return Array.from(permissions);
  }

  /**
   * Удаление чувствительных данных из User
   */
  private sanitizeUser(user: User): Partial<User> {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Умная авторизация - автоматически определяет, нужно ли регистрировать или авторизовать пользователя
   */
  async smartAuth(dto: SmartAuthDto): Promise<SmartAuthResponseDto> {
    try {
      // 1. Пытаемся найти пользователя по email
      const existingUser = await this.usersService.findByEmail(dto.email, {
        select: ['id', 'email', 'passwordHash', 'isActive', 'emailVerified', 'firstName', 'lastName'],
        relations: ['roles', 'roles.permissions', 'organization', 'team'],
      });

      if (existingUser) {
        // Пользователь существует - пытаемся авторизовать
        if (!existingUser.passwordHash) {
          return {
            success: false,
            message: 'Пользователь не имеет пароля. Используйте восстановление пароля.',
          };
        }
        
        const isPasswordValid = await bcrypt.compare(dto.password, existingUser.passwordHash);
        
        if (!isPasswordValid) {
          return {
            success: false,
            message: 'Неверный пароль',
          };
        }

        if (!existingUser.isActive) {
          return {
            success: false,
            message: 'Аккаунт деактивирован',
          };
        }

        // Проверяем, нужны ли дополнительные данные
        const missingFields: string[] = [];
        if (!existingUser.firstName) missingFields.push('firstName');
        if (!existingUser.lastName) missingFields.push('lastName');

        if (missingFields.length > 0) {
          return {
            success: true,
            message: 'Вход выполнен, но нужно дополнить информацию',
            needsAdditionalInfo: true,
            missingFields,
            user: this.sanitizeUser(existingUser),
          };
        }

        // Полная авторизация
        const accessToken = await this.generateAccessToken(existingUser);
        const refreshToken = await this.generateRefreshToken(existingUser);

        return {
          success: true,
          message: 'Вход выполнен успешно',
          accessToken,
          refreshToken,
          user: this.sanitizeUser(existingUser),
        };
      } else {
        // Пользователь не существует - создаем временного пользователя
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(dto.password, salt);

        // Создаем пользователя с минимальными данными
        const userData = {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName && dto.firstName.trim() ? dto.firstName.trim() : undefined,
          lastName: dto.lastName && dto.lastName.trim() ? dto.lastName.trim() : undefined,
          isActive: true,
          emailVerified: false,
        };

        const savedUser: User = await this.usersRepo.save(userData);

        // Обрабатываем реферальный код, если он предоставлен
        if (dto.referralCode) {
          try {
            console.log(`🔗 Обрабатываем реферальный код: ${dto.referralCode}`);
            const referralResult = await this.referralsService.attachReferralToUser(
              savedUser.id,
              dto.referralCode
            );
            
            if (referralResult.success) {
              console.log(`✅ Пользователь ${savedUser.email} привязан к рефералу ${referralResult.referrerId}`);
            } else {
              console.log(`⚠️ Не удалось привязать реферальный код: ${dto.referralCode}`);
            }
          } catch (error) {
            console.log('⚠️ Ошибка обработки реферального кода:', error.message);
          }
        }

        // Назначаем роль viewer
        try {
          const viewerRole = await this.rolesRepo.findOne({ where: { name: 'viewer' } });
          if (viewerRole) {
            await this.usersRepo
              .createQueryBuilder()
              .relation(User, 'roles')
              .of(savedUser.id)
              .add(viewerRole.id);
            console.log('👤 Пользователь зарегистрирован как viewer');
          }
        } catch (error) {
          console.log('⚠️ Ошибка назначения роли viewer:', error.message);
        }

        // Перезагружаем пользователя с ролями
        const userWithRoles = await this.usersService.findByEmail(dto.email, {
          relations: ['roles', 'roles.permissions', 'organization', 'team'],
        });

        if (!userWithRoles) {
          throw new Error('Не удалось загрузить пользователя с ролями');
        }

        // Проверяем, нужны ли дополнительные данные
        const missingFields: string[] = [];
        if (!dto.firstName) missingFields.push('firstName');
        if (!dto.lastName) missingFields.push('lastName');

        if (missingFields.length > 0) {
          return {
            success: true,
            message: 'Аккаунт создан, но нужно дополнить информацию',
            needsAdditionalInfo: true,
            missingFields,
            user: this.sanitizeUser(userWithRoles),
          };
        }

        // Полная регистрация
        const accessToken = await this.generateAccessToken(userWithRoles);
        const refreshToken = await this.generateRefreshToken(userWithRoles);

        return {
          success: true,
          message: 'Регистрация выполнена успешно',
          accessToken,
          refreshToken,
          user: this.sanitizeUser(userWithRoles),
        };
      }
    } catch (error) {
      console.error('Ошибка в smartAuth:', error);
      return {
        success: false,
        message: 'Произошла ошибка при авторизации',
      };
    }
  }

  /**
   * Дополнение информации о пользователе
   */
  async completeUserInfo(userId: string, firstName: string, lastName: string, referralCode?: string): Promise<SmartAuthResponseDto> {
    try {
      await this.usersRepo.update(userId, { firstName, lastName });
      
      // Обрабатываем реферальный код, если он предоставлен
      if (referralCode) {
        try {
          console.log(`🔗 Обрабатываем реферальный код в completeUserInfo: ${referralCode}`);
          const referralResult = await this.referralsService.attachReferralToUser(
            userId,
            referralCode
          );
          
          if (referralResult.success) {
            console.log(`✅ Пользователь ${userId} привязан к рефералу ${referralResult.referrerId}`);
          } else {
            console.log(`⚠️ Не удалось привязать реферальный код: ${referralCode}`);
          }
        } catch (error) {
          console.log('⚠️ Ошибка обработки реферального кода в completeUserInfo:', error.message);
        }
      }
      
      const updatedUser = await this.usersService.findById(userId);

      if (!updatedUser) {
        return {
          success: false,
          message: 'Пользователь не найден',
        };
      }

      const accessToken = await this.generateAccessToken(updatedUser);
      const refreshToken = await this.generateRefreshToken(updatedUser);

      return {
        success: true,
        message: 'Информация дополнена успешно',
        accessToken,
        refreshToken,
        user: this.sanitizeUser(updatedUser),
      };
    } catch (error) {
      console.error('Ошибка в completeUserInfo:', error);
      return {
        success: false,
        message: 'Произошла ошибка при дополнении информации',
      };
    }
  }

  /**
   * Отправка SMS кода для привязки телефона
   */
  async sendPhoneVerificationCode(dto: BindPhoneDto, userId: string): Promise<BindPhoneResponseDto> {
    try {
      // Проверяем, не привязан ли уже этот номер к другому пользователю
      const existingUser = await this.usersService.findByPhone(dto.phone);
      if (existingUser && existingUser.id !== userId) {
        return {
          success: false,
          message: 'Этот номер телефона уже привязан к другому аккаунту',
        };
      }

      // Генерируем код подтверждения
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Сохраняем код в базе данных
      const twoFactorCode = this.twoFactorCodesRepo.create({
        userId,
        code: verificationCode,
        type: TwoFactorType.SMS,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 минут
        status: TwoFactorStatus.PENDING,
      });
      
      await this.twoFactorCodesRepo.save(twoFactorCode);

      // Отправляем SMS (в реальном проекте здесь будет вызов SMS сервиса)
      console.log(`📱 SMS код для ${dto.phone}: ${verificationCode}`);
      
      // В тестовом режиме возвращаем код
      return {
        success: true,
        message: 'SMS с кодом подтверждения отправлено',
        verificationCode: verificationCode, // Только для тестирования
      };
    } catch (error) {
      console.error('Ошибка отправки SMS кода:', error);
      return {
        success: false,
        message: 'Ошибка отправки SMS кода',
      };
    }
  }

  /**
   * Подтверждение привязки телефона
   */
  async verifyPhoneCode(dto: VerifyPhoneDto, userId: string): Promise<BindPhoneResponseDto> {
    try {
      // Находим код подтверждения
      const verificationCode = await this.twoFactorCodesRepo.findOne({
        where: {
          userId,
          code: dto.code,
          type: TwoFactorType.SMS,
          status: TwoFactorStatus.PENDING,
        },
      });

      if (!verificationCode) {
        return {
          success: false,
          message: 'Неверный код подтверждения',
        };
      }

      // Проверяем, не истек ли код
      if (verificationCode.expiresAt < new Date()) {
        return {
          success: false,
          message: 'Код подтверждения истек',
        };
      }

      // Привязываем телефон к пользователю
      await this.usersRepo.update(userId, {
        phone: dto.phone,
        phoneVerified: true,
      });

      // Помечаем код как использованный
      await this.twoFactorCodesRepo.update(verificationCode.id, {
        status: TwoFactorStatus.USED,
      });

      return {
        success: true,
        message: 'Номер телефона успешно привязан к аккаунту',
      };
    } catch (error) {
      console.error('Ошибка подтверждения телефона:', error);
      return {
        success: false,
        message: 'Ошибка подтверждения номера телефона',
      };
    }
  }

  /**
   * Отвязка номера телефона
   */
  async unbindPhone(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.usersRepo.update(userId, {
        phone: null,
        phoneVerified: false,
      });

      return {
        success: true,
        message: 'Номер телефона отвязан от аккаунта',
      };
    } catch (error) {
      console.error('Ошибка отвязки телефона:', error);
      return {
        success: false,
        message: 'Ошибка отвязки номера телефона',
      };
    }
  }

  /**
   * Отправка письма с подтверждением email
   */
  async sendEmailVerification(dto: SendEmailVerificationDto): Promise<EmailVerificationResponseDto> {
    try {
      const user = await this.usersService.findByEmail(dto.email);
      if (!user) {
        return {
          success: false,
          message: 'Пользователь с таким email не найден',
        };
      }

      if (user.emailVerified) {
        return {
          success: false,
          message: 'Email уже подтвержден',
        };
      }

      // Генерируем токен подтверждения
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа

      // Сохраняем токен в БД
      const verificationToken = this.emailVerificationTokensRepo.create({
        token,
        userId: user.id,
        email: user.email,
        expiresAt,
        isUsed: false,
        status: 'pending',
      });

      await this.emailVerificationTokensRepo.save(verificationToken);

      // Формируем ссылку для подтверждения
      const verificationLink = `http://localhost:3002/?verify-email=true&token=${token}`;

      // Отправляем реальное письмо
      try {
        await this.emailService.sendEmailVerification(dto.email, verificationLink);
      } catch (error) {
        console.error('❌ Ошибка отправки письма:', error);
        // Fallback - показываем ссылку в логах
        console.log(`📧 Fallback - ссылка для ${dto.email}:`);
        console.log(`🔗 Ссылка: ${verificationLink}`);
      }

      return {
        success: true,
        message: 'Письмо с подтверждением отправлено на ваш email',
        verificationToken: token, // Только для тестирования
      };
    } catch (error) {
      console.error('Ошибка отправки письма подтверждения:', error);
      return {
        success: false,
        message: 'Ошибка отправки письма подтверждения',
      };
    }
  }

  /**
   * Подтверждение email по токену
   */
  async verifyEmail(dto: VerifyEmailDto): Promise<EmailVerificationResponseDto> {
    try {
      const verificationToken = await this.emailVerificationTokensRepo.findOne({
        where: { token: dto.token },
        relations: ['user'],
      });

      if (!verificationToken) {
        return {
          success: false,
          message: 'Неверный токен подтверждения',
        };
      }

      if (verificationToken.isUsed) {
        return {
          success: false,
          message: 'Токен уже использован',
        };
      }

      if (verificationToken.expiresAt < new Date()) {
        return {
          success: false,
          message: 'Токен подтверждения истек',
        };
      }

      // Обновляем статус пользователя
      await this.usersRepo.update(verificationToken.userId, {
        emailVerified: true,
      });

      // Помечаем токен как использованный
      await this.emailVerificationTokensRepo.update(verificationToken.id, {
        isUsed: true,
        status: 'verified',
      });

      // Повышаем роль пользователя (например, с viewer на editor)
      // Ищем роль editor без привязки к организации или команде
      console.log('🔍 Ищем глобальную роль editor...');
      const editorRole = await this.rolesRepo.findOne({
        where: { 
          name: 'editor',
          organizationId: IsNull(),
          teamId: IsNull()
        },
      });

      console.log('🔍 Найденная роль editor:', editorRole);

      if (editorRole) {
        console.log('🔍 Заменяем роль пользователя на editor:', verificationToken.userId);
        await this.rbacService.replaceUserRole(
          verificationToken.userId,
          editorRole.id,
          'system', // Система повышает роль
        );
        console.log('✅ Роль editor успешно назначена (заменена)');
      } else {
        console.log('❌ Глобальная роль editor не найдена, пропускаем повышение роли');
      }

      return {
        success: true,
        message: 'Email успешно подтвержден! Ваша роль повышена до editor.',
      };
    } catch (error) {
      console.error('Ошибка подтверждения email:', error);
      return {
        success: false,
        message: 'Ошибка подтверждения email',
      };
    }
  }
}