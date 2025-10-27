import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthMethodType } from '../enums/auth-method-type.enum';
import { PhoneVerificationResult, MessengerMetadata } from '../interfaces/multi-auth.interface';

@Injectable()
export class PhoneAuthService {
  private readonly logger = new Logger(PhoneAuthService.name);
  private storedCodes = new Map<string, { code: string; expiresAt: Date }>(); // Хранилище кодов в памяти для мок-тестирования

  constructor(private configService: ConfigService) {}

  /**
   * Отправка SMS кода через WhatsApp
   */
  async sendWhatsAppCode(
    phoneNumber: string,
    code: string,
    purpose: string = 'verification',
  ): Promise<PhoneVerificationResult> {
    try {
      const whatsappApiUrl = this.configService.get<string>('WHATSAPP_API_URL');
      const whatsappToken = this.configService.get<string>('WHATSAPP_TOKEN');
      
      if (!whatsappApiUrl || !whatsappToken) {
        this.logger.warn('⚠️ WhatsApp API не настроен, используем mock режим');
        return this.sendCodeMock(phoneNumber, code, purpose, 'whatsapp');
      }

      // Реальная интеграция с WhatsApp Business API
      const message = this.formatWhatsAppMessage(code, purpose);
      
      const response = await fetch(`${whatsappApiUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
          type: 'text',
          text: {
            body: message,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      this.logger.log(`WhatsApp код отправлен на ${phoneNumber}: ${code}`);
      
      return {
        success: true,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 минут
      };

    } catch (error) {
      this.logger.error(`Ошибка отправки WhatsApp кода: ${error.message}`);
      return {
        success: false,
        error: 'Не удалось отправить код через WhatsApp',
      };
    }
  }

  /**
   * Отправка кода через Telegram Bot
   */
  async sendTelegramCode(
    phoneNumber: string,
    code: string,
    purpose: string = 'verification',
  ): Promise<PhoneVerificationResult> {
    try {
      const telegramBotToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
      const telegramChatId = this.configService.get<string>('TELEGRAM_CHAT_ID');
      
      if (!telegramBotToken || !telegramChatId) {
        this.logger.warn('⚠️ Telegram Bot не настроен, код будет отображаться в логах');
        return this.sendCodeMock(phoneNumber, code, purpose, 'telegram');
      }

      // Отправляем код в Telegram чат
      const message = `🔐 Код подтверждения для ${phoneNumber}: ${code}\n\n⏰ Действителен 10 минут\n\nℹ️ Purpose: ${purpose}`;
      
      const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.logger.error(`Telegram API error: ${JSON.stringify(errorData)}`);
        throw new Error(`Telegram API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Сохраняем код в памяти для последующей проверки
      this.storedCodes.set(phoneNumber, {
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });
      
      this.logger.log(`✅ Telegram код отправлен на номер ${phoneNumber}: ${code}`);
      this.logger.log(`📱 Проверьте Telegram чат (chat_id: ${telegramChatId})`);
      
      return {
        success: true,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };

    } catch (error) {
      this.logger.error(`Ошибка отправки Telegram кода: ${error.message}`);
      // Fallback на mock если Telegram не работает
      return this.sendCodeMock(phoneNumber, code, purpose, 'telegram');
    }
  }

  /**
   * Отправка SMS через SmsAero
   */
  private async sendSmsViaSmsaero(
    phoneNumber: string,
    code: string,
    purpose: string,
  ): Promise<PhoneVerificationResult> {
    const email = this.configService.get<string>('SMSAERO_EMAIL') || '';
    const apiKey = this.configService.get<string>('SMSAERO_API_KEY') || '';
    const from = this.configService.get<string>('SMSAERO_FROM') || 'Loginus';
    
    const formattedPhone = this.formatPhoneForSms(phoneNumber);
    const message = `Ваш код подтверждения: ${code}. Действителен 10 минут.`;
    
    const crypto = require('crypto');
    const passwordHash = crypto.createHash('md5').update(apiKey).digest('hex');
    
    const params = new URLSearchParams();
    params.append('user', email);
    params.append('password', passwordHash);
    params.append('to', formattedPhone);
    params.append('text', message);
    params.append('from', from);
    params.append('answer', 'json');
    
    const response = await fetch(`https://gate.smsaero.ru/send/?${params.toString()}`, {
      method: 'GET',
    });

    const result = await response.json();
    
    this.logger.log(`📱 SmsAero ответ: ${JSON.stringify(result)}`);
    
    if (!result.success) {
      throw new Error(`SmsAero error: ${result.message || 'Unknown error'}`);
    }

    // Сохраняем код в памяти для последующей проверки
    this.storedCodes.set(phoneNumber, {
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    
    this.logger.log(`✅ SMS код отправлен на ${phoneNumber}: ${code}`);
    
    return {
      success: true,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    };
  }

  /**
   * Форматирование номера для SMS (только цифры)
   */
  private formatPhoneForSms(phone: string): string {
    // Убираем все кроме цифр
    const digits = phone.replace(/\D/g, '');
    return digits;
  }

  /**
   * Универсальная отправка кода через выбранный мессенджер
   */
  async sendCode(
    phoneNumber: string,
    code: string,
    messenger: 'whatsapp' | 'telegram',
    purpose: string = 'verification',
  ): Promise<PhoneVerificationResult> {
    // Нормализуем номер телефона
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    
    if (!this.isValidPhoneNumber(normalizedPhone)) {
      return {
        success: false,
        error: 'Неверный формат номера телефона',
      };
    }

    switch (messenger) {
      case 'whatsapp':
        return this.sendWhatsAppCode(normalizedPhone, code, purpose);
      case 'telegram':
        return this.sendTelegramCode(normalizedPhone, code, purpose);
      default:
        return {
          success: false,
          error: 'Неподдерживаемый мессенджер',
        };
    }
  }

  /**
   * Проверка кода подтверждения
   */
  async verifyCode(
    phoneNumber: string,
    messengerType: 'WHATSAPP' | 'TELEGRAM',
    code: string,
    purpose: 'login' | 'registration' | 'verification',
  ): Promise<PhoneVerificationResult> {
    // Нормализуем номер телефона
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    
    if (!this.isValidPhoneNumber(normalizedPhone)) {
      return {
        success: false,
        error: 'Неверный формат номера телефона',
      };
    }

    // Проверяем код из хранилища в памяти
    const stored = this.storedCodes.get(normalizedPhone);
    
    if (!stored) {
      this.logger.warn(`[MOCK] Код не найден для ${normalizedPhone}`);
      return {
        success: false,
        error: 'Код не найден или истек',
      };
    }

    if (stored.expiresAt < new Date()) {
      this.logger.warn(`[MOCK] Код истек для ${normalizedPhone}`);
      this.storedCodes.delete(normalizedPhone);
      return {
        success: false,
        error: 'Код истек',
      };
    }

    if (stored.code !== code) {
      this.logger.warn(`[MOCK] Неверный код для ${normalizedPhone}`);
      return {
        success: false,
        error: 'Неверный код',
      };
    }

    this.logger.log(`[MOCK] ✅ Код успешно проверен для ${normalizedPhone}`);
    this.storedCodes.delete(normalizedPhone);
    
    return {
      success: true,
      code,
      expiresAt: stored.expiresAt,
    };
  }

  /**
   * Получение предпочтений пользователя по мессенджерам
   */
  async getUserMessengerPreferences(userId: string): Promise<{
    whatsapp: boolean;
    telegram: boolean;
    preferred: 'whatsapp' | 'telegram' | null;
  }> {
    // Здесь должна быть логика получения предпочтений пользователя из БД
    // Пока возвращаем заглушку
    return {
      whatsapp: true,
      telegram: true,
      preferred: 'whatsapp',
    };
  }

  /**
   * Обновление предпочтений пользователя по мессенджерам
   */
  async updateMessengerPreferences(
    userId: string,
    preferences: {
      whatsapp: boolean;
      telegram: boolean;
      preferred: 'whatsapp' | 'telegram' | null;
    },
  ): Promise<void> {
    // Здесь должна быть логика сохранения предпочтений в БД
    this.logger.log(`Обновлены предпочтения мессенджеров для пользователя ${userId}:`, preferences);
  }

  /**
   * Проверка доступности мессенджера для номера телефона
   */
  async checkMessengerAvailability(
    phoneNumber: string,
    messenger: 'whatsapp' | 'telegram',
  ): Promise<boolean> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    
    try {
      switch (messenger) {
        case 'whatsapp':
          return await this.checkWhatsAppAvailability(normalizedPhone);
        case 'telegram':
          return await this.checkTelegramAvailability(normalizedPhone);
        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`Ошибка проверки доступности ${messenger}: ${error.message}`);
      return false;
    }
  }

  // Приватные методы

  private async checkWhatsAppAvailability(phoneNumber: string): Promise<boolean> {
    // Здесь должна быть проверка через WhatsApp Business API
    // Пока возвращаем заглушку
    this.logger.log(`Проверка доступности WhatsApp для ${phoneNumber}`);
    return true;
  }

  private async checkTelegramAvailability(phoneNumber: string): Promise<boolean> {
    // Здесь должна быть проверка через Telegram API
    // Пока возвращаем заглушку
    this.logger.log(`Проверка доступности Telegram для ${phoneNumber}`);
    return true;
  }

  private normalizePhoneNumber(phoneNumber: string): string {
    // Удаляем все символы кроме цифр и +
    let normalized = phoneNumber.replace(/[^\d+]/g, '');
    
    // Если номер начинается с 8, заменяем на +7
    if (normalized.startsWith('8')) {
      normalized = '+7' + normalized.substring(1);
    }
    
    // Если номер начинается с 7, добавляем +
    if (normalized.startsWith('7') && !normalized.startsWith('+7')) {
      normalized = '+' + normalized;
    }
    
    return normalized;
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Простая проверка формата номера телефона
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  private formatWhatsAppMessage(code: string, purpose: string): string {
    const messages = {
      verification: `🔐 Код верификации: ${code}\n\nЭтот код действителен в течение 10 минут.`,
      registration: `🎉 Добро пожаловать!\n\nКод подтверждения: ${code}\n\nЭтот код действителен в течение 10 минут.`,
      login: `🔑 Код для входа: ${code}\n\nЭтот код действителен в течение 10 минут.`,
      password_reset: `🔄 Сброс пароля\n\nКод подтверждения: ${code}\n\nЭтот код действителен в течение 10 минут.`,
    };

    return messages[purpose] || messages.verification;
  }

  private formatTelegramMessage(phoneNumber: string, code: string, purpose: string): string {
    const messages = {
      verification: `🔐 <b>Код верификации</b>\n\nНомер: ${phoneNumber}\nКод: <code>${code}</code>\n\n⏰ Действителен 10 минут`,
      registration: `🎉 <b>Добро пожаловать!</b>\n\nНомер: ${phoneNumber}\nКод подтверждения: <code>${code}</code>\n\n⏰ Действителен 10 минут`,
      login: `🔑 <b>Код для входа</b>\n\nНомер: ${phoneNumber}\nКод: <code>${code}</code>\n\n⏰ Действителен 10 минут`,
      password_reset: `🔄 <b>Сброс пароля</b>\n\nНомер: ${phoneNumber}\nКод подтверждения: <code>${code}</code>\n\n⏰ Действителен 10 минут`,
    };

    return messages[purpose] || messages.verification;
  }

  /**
   * Mock отправка кода (используется если API не настроено)
   */
  private async sendCodeMock(
    phoneNumber: string,
    code: string,
    purpose: string,
    messenger: 'whatsapp' | 'telegram',
  ): Promise<PhoneVerificationResult> {
    // Сохраняем код в памяти
    this.storedCodes.set(phoneNumber, {
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    
    this.logger.log(`[MOCK] ${messenger.toUpperCase()} код отправлен на ${phoneNumber}: ${code} (${purpose})`);
    this.logger.log(`💡 Для реальной отправки настройте ${messenger.toUpperCase()}_API_URL и ${messenger.toUpperCase()}_TOKEN в .env`);
    
    return {
      success: true,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    };
  }
}
