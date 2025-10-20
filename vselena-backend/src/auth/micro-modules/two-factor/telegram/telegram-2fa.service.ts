import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { TwoFactorCode } from '../../../entities/two-factor-code.entity';
import { User } from '../../../../users/entities/user.entity';
import { SmsService } from '../../../sms.service'; // Используем SmsService для Telegram

@Injectable()
export class TelegramTwoFactorService {
  constructor(
    @InjectRepository(TwoFactorCode)
    private twoFactorCodeRepo: Repository<TwoFactorCode>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private smsService: SmsService, // Telegram использует тот же сервис
  ) {}

  /**
   * Отправка 2FA кода через Telegram
   */
  async sendTelegramCode(userId: string, telegramChatId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Проверяем rate limit
      const canSend = await this.checkRateLimit(userId, 'telegram');
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
        type: 'sms' as any, // Используем SMS тип для Telegram
        expiresAt,
        contact: telegramChatId,
        status: 'pending' as any,
      });

      // Отправляем через Telegram
      const telegramResult = await this.smsService.sendTelegramMessage(
        telegramChatId, 
        `🔐 Ваш код подтверждения: ${code}\n\nКод действителен 10 минут.`
      );
      
      if (!telegramResult.success) {
        return {
          success: false,
          message: 'Ошибка отправки в Telegram',
        };
      }

      console.log(`📱 2FA код отправлен в Telegram: ${telegramChatId}`);

      return {
        success: true,
        message: 'Код отправлен в Telegram',
      };
    } catch (error) {
      console.error('❌ Ошибка отправки 2FA кода в Telegram:', error);
      return {
        success: false,
        message: 'Ошибка отправки кода',
      };
    }
  }

  /**
   * Проверка 2FA кода
   */
  async verifyTelegramCode(userId: string, code: string): Promise<{ success: boolean; message: string }> {
    try {
      const codeRecord = await this.twoFactorCodeRepo.findOne({
        where: {
          userId,
          code,
          type: 'sms' as any, // Используем SMS тип для Telegram
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

      // Обновляем статус пользователя (используем phoneVerified как аналог)
      await this.userRepo.update(userId, { phoneVerified: true });

      console.log(`✅ Telegram 2FA код подтвержден для пользователя ${userId}`);

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
        type: 'sms' as any, // Используем SMS тип для Telegram
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
}
