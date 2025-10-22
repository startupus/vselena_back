import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { TwoFactorCode } from '../../../entities/two-factor-code.entity';
import { User } from '../../../../users/entities/user.entity';
import { EmailService } from '../../../email.service';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { RefreshToken } from '../../../entities/refresh-token.entity';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EmailTwoFactorService {
  constructor(
    @InjectRepository(TwoFactorCode)
    private twoFactorCodeRepo: Repository<TwoFactorCode>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
    private emailService: EmailService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Отправка 2FA кода на email
   */
  async sendEmailCode(userId: string, email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Проверяем rate limit
      const canSend = await this.checkRateLimit(userId, 'email');
      if (!canSend) {
        return {
          success: false,
          message: 'Слишком много запросов. Попробуйте позже.',
        };
      }

      // Генерируем код
      const code = this.generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

      // Сохраняем код
      await this.twoFactorCodeRepo.save({
        userId,
        code,
        type: 'email' as any,
        expiresAt,
        contact: email,
        status: 'pending' as any,
      });

      // Отправляем email с кодом
      await this.emailService.sendVerificationCode(email, code);

      console.log(`📧 2FA код отправлен на email: ${email}`);

      return {
        success: true,
        message: 'Код отправлен на email',
      };
    } catch (error) {
      console.error('❌ Ошибка отправки 2FA кода на email:', error);
      return {
        success: false,
        message: 'Ошибка отправки кода',
      };
    }
  }

  /**
   * Проверка 2FA кода
   */
  async verifyEmailCode(userId: string, code: string): Promise<{ success: boolean; message: string }> {
    try {
      const codeRecord = await this.twoFactorCodeRepo.findOne({
        where: {
          userId,
          code,
          type: 'email' as any,
          status: 'pending' as any,
        },
      });

      if (!codeRecord) {
        return {
          success: false,
          message: 'Неверный код',
        };
      }

      if (codeRecord.expiresAt < new Date()) {
        return {
          success: false,
          message: 'Код истек',
        };
      }

      // Отмечаем код как использованный
      await this.twoFactorCodeRepo.update(codeRecord.id, { status: 'used' as any });

      // Обновляем статус пользователя
      await this.userRepo.update(userId, { emailVerified: true });

      console.log(`✅ Email 2FA код подтвержден для пользователя ${userId}`);

      return {
        success: true,
        message: 'Код подтвержден',
      };
    } catch (error) {
      console.error('❌ Ошибка проверки 2FA кода:', error);
      return {
        success: false,
        message: 'Ошибка проверки кода',
      };
    }
  }

  /**
   * Проверка rate limit
   */
  private async checkRateLimit(userId: string, method: string): Promise<boolean> {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    
    const recentCodes = await this.twoFactorCodeRepo.count({
      where: {
        userId,
        type: method as any,
        createdAt: MoreThan(oneMinuteAgo),
      },
    });

    return recentCodes < 3; // Максимум 3 кода в минуту
  }

  /**
   * Генерация 6-значного кода
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Поиск пользователя по email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    console.log(`🔍 Поиск пользователя по email: ${email}`);
    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['organizations', 'teams'],
    });
    console.log(`🔍 Результат поиска: ${user ? 'найден' : 'не найден'}`);
    return user;
  }

  /**
   * Генерация токенов для пользователя
   */
  async generateTokensForUser(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    // Генерируем Access Token
    const permissions = user.userRoleAssignments?.flatMap(assignment => 
      assignment.role?.permissions?.map(p => p.name) || []
    ) || [];
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      organizationId: user.organizations?.[0]?.id || null,
      teamId: user.teams?.[0]?.id || null,
      roles: user.userRoleAssignments?.map(a => a.role?.name).filter(Boolean) || [],
      permissions,
    });

    // Генерируем Refresh Token
    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // +7 дней

    await this.refreshTokenRepo.save({
      token: refreshToken,
      userId: user.id,
      expiresAt,
      isRevoked: false,
    });

    return { accessToken, refreshToken };
  }
}
