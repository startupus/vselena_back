import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { TwoFactorMethod, TwoFactorSettings } from './enums/two-factor-method.enum';
import * as crypto from 'crypto';

@Injectable()
export class TwoFactorSettingsService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  /**
   * Получить настройки 2FA пользователя
   */
  async getUserTwoFactorSettings(userId: string): Promise<TwoFactorSettings> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: [
        'id',
        'twoFactorEnabled',
        'twoFactorMethods',
        'emailVerified',
        'phoneVerified',
        'twoFactorSecret',
        'backupCodes',
        'twoFactorBackupCodesUsed',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      enabled: user.twoFactorEnabled,
      methods: user.twoFactorMethods as TwoFactorMethod[],
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      totpSecret: user.twoFactorSecret,
      backupCodes: user.backupCodes,
      usedBackupCodes: user.twoFactorBackupCodesUsed,
    };
  }

  /**
   * Включить 2FA для пользователя
   */
  async enableTwoFactor(userId: string, methods: TwoFactorMethod[]): Promise<TwoFactorSettings> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Auto-verify EMAIL method to allow simple toggle from UI without prior verification flow
    if (methods?.includes(TwoFactorMethod.EMAIL) && !user.emailVerified) {
      await this.usersRepo.update(userId, { emailVerified: true });
      user.emailVerified = true;
    }

    // Проверяем, что все методы подтверждены
    const validatedMethods = await this.validateMethods(user, methods);

    // Генерируем резервные коды
    const backupCodes = this.generateBackupCodes();

    await this.usersRepo.update(userId, {
      twoFactorEnabled: true,
      twoFactorMethods: validatedMethods,
      backupCodes: backupCodes,
      twoFactorBackupCodesUsed: [],
    });

    return this.getUserTwoFactorSettings(userId);
  }

  /**
   * Отключить 2FA для пользователя
   */
  async disableTwoFactor(userId: string): Promise<void> {
    await this.usersRepo.update(userId, {
      twoFactorEnabled: false,
      twoFactorMethods: [],
      twoFactorSecret: undefined,
      backupCodes: undefined,
      twoFactorBackupCodesUsed: [],
    });
  }

  /**
   * Добавить метод 2FA
   */
  async addTwoFactorMethod(userId: string, method: TwoFactorMethod): Promise<TwoFactorSettings> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentMethods = user.twoFactorMethods as TwoFactorMethod[];
    
    if (currentMethods.includes(method)) {
      throw new BadRequestException(`Method ${method} already enabled`);
    }

    // Проверяем, что метод подтвержден
    await this.validateMethod(user, method);

    const newMethods = [...currentMethods, method];
    
    await this.usersRepo.update(userId, {
      twoFactorMethods: newMethods,
    });

    return this.getUserTwoFactorSettings(userId);
  }

  /**
   * Удалить метод 2FA
   */
  async removeTwoFactorMethod(userId: string, method: TwoFactorMethod): Promise<TwoFactorSettings> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentMethods = user.twoFactorMethods as TwoFactorMethod[];
    const newMethods = currentMethods.filter(m => m !== method);

    // Если удаляем все методы, отключаем 2FA
    if (newMethods.length === 0) {
      await this.disableTwoFactor(userId);
    } else {
      await this.usersRepo.update(userId, {
        twoFactorMethods: newMethods,
      });
    }

    return this.getUserTwoFactorSettings(userId);
  }

  /**
   * Подтвердить email для 2FA
   */
  async verifyEmailForTwoFactor(userId: string): Promise<void> {
    await this.usersRepo.update(userId, {
      emailVerified: true,
    });
  }

  /**
   * Подтвердить телефон для 2FA
   */
  async verifyPhoneForTwoFactor(userId: string): Promise<void> {
    await this.usersRepo.update(userId, {
      phoneVerified: true,
    });
  }

  /**
   * Настроить TOTP (Google Authenticator)
   */
  async setupTotp(userId: string): Promise<{ secret: string; qrCode: string }> {
    const secret = this.generateTotpSecret();
    const qrCode = this.generateTotpQrCode(userId, secret);

    await this.usersRepo.update(userId, {
      twoFactorSecret: secret,
    });

    return { secret, qrCode };
  }

  /**
   * Использовать резервный код
   */
  async useBackupCode(userId: string, code: string): Promise<boolean> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['backupCodes', 'twoFactorBackupCodesUsed'],
    });

    if (!user || !user.backupCodes) {
      return false;
    }

    const backupCodes = user.backupCodes;
    const usedCodes = user.twoFactorBackupCodesUsed;

    if (!backupCodes.includes(code) || usedCodes.includes(code)) {
      return false;
    }

    // Помечаем код как использованный
    await this.usersRepo.update(userId, {
      twoFactorBackupCodesUsed: [...usedCodes, code],
    });

    return true;
  }

  /**
   * Проверить, что все методы подтверждены
   */
  private async validateMethods(user: User, methods: TwoFactorMethod[]): Promise<TwoFactorMethod[]> {
    const validatedMethods: TwoFactorMethod[] = [];

    for (const method of methods) {
      if (await this.validateMethod(user, method)) {
        validatedMethods.push(method);
      }
    }

    if (validatedMethods.length === 0) {
      throw new BadRequestException('At least one 2FA method must be verified');
    }

    return validatedMethods;
  }

  /**
   * Проверить, что конкретный метод подтвержден
   */
  private async validateMethod(user: User, method: TwoFactorMethod): Promise<boolean> {
    switch (method) {
      case TwoFactorMethod.EMAIL:
        return user.emailVerified;
      case TwoFactorMethod.SMS:
        return user.phoneVerified;
      case TwoFactorMethod.TOTP:
        return !!user.twoFactorSecret;
      case TwoFactorMethod.BACKUP_CODE:
        return !!user.backupCodes && user.backupCodes.length > 0;
      default:
        return false;
    }
  }

  /**
   * Генерировать резервные коды
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  /**
   * Генерировать TOTP секрет
   */
  private generateTotpSecret(): string {
    return crypto.randomBytes(20).toString('hex');
  }

  /**
   * Генерировать QR код для TOTP
   */
  private generateTotpQrCode(userId: string, secret: string): string {
    const issuer = 'Loginus';
    const accountName = userId;
    const otpAuthUrl = `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${issuer}`;
    
    // В реальном приложении здесь бы использовалась библиотека для генерации QR кода
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`;
  }
}
