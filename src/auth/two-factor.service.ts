import { Injectable, BadRequestException, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { TwoFactorCode, TwoFactorType, TwoFactorStatus } from './entities/two-factor-code.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { UsersService } from '../users/users.service';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import * as crypto from 'crypto';

export interface SendCodeDto {
  type: TwoFactorType;
  contact: string; // email или номер телефона
  ipAddress?: string;
  userAgent?: string;
}

export interface VerifyCodeDto {
  code: string;
  contact: string;
  type: TwoFactorType;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class TwoFactorService {
  constructor(
    @InjectRepository(TwoFactorCode)
    private twoFactorCodeRepo: Repository<TwoFactorCode>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
    private configService: ConfigService,
    private jwtService: JwtService,
    private usersService: UsersService,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {
    console.log('🔧 TwoFactorService инициализирован с SmsService');
  }

  /**
   * Отправка кода на email или SMS
   */
  async sendCode(dto: SendCodeDto): Promise<{ message: string; expiresIn: number }> {
    // Валидация контакта
    this.validateContact(dto.contact, dto.type);

    // Найти пользователя по контакту
    const user = await this.findUserByContact(dto.contact, dto.type);
    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    // Проверить лимиты отправки
    await this.checkRateLimit(user.id, dto.type);

    // Деактивировать предыдущие коды
    await this.deactivatePreviousCodes(user.id, dto.type);

    // Генерировать новый код
    const code = this.generateCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 минут

    // Сохранить код
    const twoFactorCode = this.twoFactorCodeRepo.create({
      userId: user.id,
      type: dto.type,
      code,
      contact: dto.contact,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      expiresAt,
      status: TwoFactorStatus.PENDING,
    });

    await this.twoFactorCodeRepo.save(twoFactorCode);

    // Отправить код (в реальном проекте здесь будет интеграция с email/SMS сервисами)
    await this.deliverCode(dto.contact, code, dto.type);

    return {
      message: `Код отправлен на ${this.maskContact(dto.contact, dto.type)}`,
      expiresIn: 600, // 10 минут в секундах
    };
  }

  /**
   * Проверка кода
   */
  async verifyCode(dto: VerifyCodeDto): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    // Найти код
    const twoFactorCode = await this.twoFactorCodeRepo.findOne({
      where: {
        code: dto.code,
        contact: dto.contact,
        type: dto.type,
        status: TwoFactorStatus.PENDING,
      },
      relations: ['user', 'user.userRoleAssignments', 'user.userRoleAssignments.role', 'user.userRoleAssignments.role.permissions'],
    });

    if (!twoFactorCode) {
      throw new UnauthorizedException('Неверный код');
    }

    // Проверить срок действия
    if (twoFactorCode.expiresAt < new Date()) {
      twoFactorCode.status = TwoFactorStatus.EXPIRED;
      await this.twoFactorCodeRepo.save(twoFactorCode);
      throw new UnauthorizedException('Код истек');
    }

    // Проверить количество попыток
    if (twoFactorCode.attempts >= twoFactorCode.maxAttempts) {
      twoFactorCode.status = TwoFactorStatus.EXPIRED;
      await this.twoFactorCodeRepo.save(twoFactorCode);
      throw new HttpException('Превышено количество попыток', HttpStatus.TOO_MANY_REQUESTS);
    }

    // Увеличить счетчик попыток
    twoFactorCode.attempts += 1;
    await this.twoFactorCodeRepo.save(twoFactorCode);

    // Проверить код
    if (twoFactorCode.code !== dto.code) {
      throw new UnauthorizedException('Неверный код');
    }

    // Код верный - деактивировать его
    twoFactorCode.status = TwoFactorStatus.VERIFIED;
    twoFactorCode.verifiedAt = new Date();
    await this.twoFactorCodeRepo.save(twoFactorCode);

    // Генерировать токены (используем существующую логику из AuthService)
    const accessToken = await this.generateAccessToken(twoFactorCode.user);
    const refreshToken = await this.generateRefreshToken(twoFactorCode.user);

    return {
      user: twoFactorCode.user,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Проверка лимитов отправки кодов
   */
  private async checkRateLimit(userId: string, type: TwoFactorType): Promise<void> {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentCodes = await this.twoFactorCodeRepo
      .createQueryBuilder('code')
      .where('code.userId = :userId', { userId })
      .andWhere('code.type = :type', { type })
      .andWhere('code.createdAt >= :oneHourAgo', { oneHourAgo })
      .getCount();

    const maxCodesPerHour = this.configService.get<number>('TWO_FACTOR_MAX_CODES_PER_HOUR', 5);
    if (recentCodes >= maxCodesPerHour) {
      throw new HttpException('Превышен лимит отправки кодов. Попробуйте позже.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  /**
   * Деактивация предыдущих кодов
   */
  private async deactivatePreviousCodes(userId: string, type: TwoFactorType): Promise<void> {
    await this.twoFactorCodeRepo.update(
      {
        userId,
        type,
        status: TwoFactorStatus.PENDING,
      },
      {
        status: TwoFactorStatus.EXPIRED,
      },
    );
  }

  /**
   * Генерация 6-значного кода
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Валидация контакта
   */
  private validateContact(contact: string, type: TwoFactorType): void {
    if (type === TwoFactorType.EMAIL) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contact)) {
        throw new BadRequestException('Неверный формат email');
      }
    } else if (type === TwoFactorType.SMS) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(contact.replace(/\s/g, ''))) {
        throw new BadRequestException('Неверный формат номера телефона');
      }
    }
  }

  /**
   * Поиск пользователя по контакту
   */
  private async findUserByContact(contact: string, type: TwoFactorType): Promise<User | null> {
    if (type === TwoFactorType.EMAIL) {
      return this.usersService.findByEmail(contact);
    } else if (type === TwoFactorType.SMS) {
      // Поиск по номеру телефона
      return this.usersService.findByPhone(contact);
    }
    return null;
  }

  /**
   * Маскирование контакта для безопасности
   */
  private maskContact(contact: string, type: TwoFactorType): string {
    if (type === TwoFactorType.EMAIL) {
      const [local, domain] = contact.split('@');
      return `${local.substring(0, 2)}***@${domain}`;
    } else if (type === TwoFactorType.SMS) {
      return contact.replace(/(\d{3})\d{3}(\d{3})/, '$1***$2');
    }
    return contact;
  }

  /**
   * Отправка кода (с реальной отправкой email и SMS)
   */
  private async deliverCode(contact: string, code: string, type: TwoFactorType): Promise<void> {
    if (type === TwoFactorType.EMAIL) {
      await this.emailService.sendVerificationCode(contact, code);
    } else if (type === TwoFactorType.SMS) {
      await this.smsService.sendVerificationCode(contact, code);
    }
  }

  /**
   * Генерация Access Token
   */
  private async generateAccessToken(user: User): Promise<string> {
    const roles = user.userRoleAssignments?.map(assignment => assignment.role?.name).filter(Boolean) || [];
    const permissions = user.userRoleAssignments?.flatMap(assignment => 
      assignment.role?.permissions?.map(p => p.name) || []
    ) || [];

    const payload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizations?.[0]?.id || null,
      teamId: user.teams?.[0]?.id || null,
      roles: roles,
      permissions: permissions,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Генерация Refresh Token
   */
  private async generateRefreshToken(user: User): Promise<string> {
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // +7 дней

    await this.refreshTokenRepo.save({
      token,
      userId: user.id,
      expiresAt,
      isRevoked: false,
    });

    return token;
  }

  /**
   * Получение активных кодов пользователя
   */
  async getUserActiveCodes(userId: string): Promise<TwoFactorCode[]> {
    return this.twoFactorCodeRepo
      .createQueryBuilder('code')
      .where('code.userId = :userId', { userId })
      .andWhere('code.status = :status', { status: TwoFactorStatus.PENDING })
      .andWhere('code.expiresAt > :now', { now: new Date() })
      .orderBy('code.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Отзыв всех активных кодов пользователя
   */
  async revokeUserCodes(userId: string): Promise<void> {
    await this.twoFactorCodeRepo.update(
      {
        userId,
        status: TwoFactorStatus.PENDING,
      },
      {
        status: TwoFactorStatus.EXPIRED,
      },
    );
  }
}
