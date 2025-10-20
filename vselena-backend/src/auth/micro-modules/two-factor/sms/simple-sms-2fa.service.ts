import { Injectable } from '@nestjs/common';
import { SimpleMicroModuleBase } from '../../base/simple-micro-module.base';
import { SimpleMicroModule } from '../../base/simple-micro-module.interface';

@Injectable()
export class SimpleSms2FAService extends SimpleMicroModuleBase {
  getModuleInfo(): SimpleMicroModule {
    return {
      name: 'sms-2fa',
      version: '1.0.0',
      description: 'Двухфакторная аутентификация через SMS',
      type: '2fa',
      enabled: true,
      priority: 20,
    };
  }
  /**
   * Отправка 2FA кода по SMS
   */
  async sendSmsCode(phone: string, code: string): Promise<boolean> {
    console.log(`📱 [SimpleSms2FA] Отправка кода ${code} на ${phone}`);
    // Здесь будет реальная логика отправки SMS
    return true;
  }

  /**
   * Верификация 2FA кода
   */
  async verifySmsCode(phone: string, code: string): Promise<boolean> {
    console.log(`📱 [SimpleSms2FA] Верификация кода ${code} для ${phone}`);
    // Здесь будет реальная логика верификации
    return code === '654321'; // Заглушка для тестирования
  }

  /**
   * Генерация 6-значного кода
   */
  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
