import { Injectable } from '@nestjs/common';
import { SimpleMicroModuleBase } from '../../base/simple-micro-module.base';
import { SimpleMicroModule } from '../../base/simple-micro-module.interface';

@Injectable()
export class SimpleEmail2FAService extends SimpleMicroModuleBase {
  getModuleInfo(): SimpleMicroModule {
    return {
      name: 'email-2fa',
      version: '1.0.0',
      description: 'Двухфакторная аутентификация через Email',
      type: '2fa',
      enabled: true,
      priority: 10,
    };
  }
  /**
   * Отправка 2FA кода на email
   */
  async sendEmailCode(email: string, code: string): Promise<boolean> {
    console.log(`📧 [SimpleEmail2FA] Отправка кода ${code} на ${email}`);
    // Здесь будет реальная логика отправки email
    return true;
  }

  /**
   * Верификация 2FA кода
   */
  async verifyEmailCode(email: string, code: string): Promise<boolean> {
    console.log(`📧 [SimpleEmail2FA] Верификация кода ${code} для ${email}`);
    // Здесь будет реальная логика верификации
    return code === '123456'; // Заглушка для тестирования
  }

  /**
   * Генерация 6-значного кода
   */
  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
