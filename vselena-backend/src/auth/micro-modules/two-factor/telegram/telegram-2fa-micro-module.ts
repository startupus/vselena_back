import { Module, Injectable } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TwoFactorMicroModule } from '../../base/auth-micro-module.interface';
import { BaseAuthMicroModule } from '../../base/auth-micro-module.abstract';
import { TelegramTwoFactorService } from './telegram-2fa.service';
import { TelegramTwoFactorController } from './telegram-2fa.controller';
import { TwoFactorCode } from '../../../entities/two-factor-code.entity';
import { User } from '../../../../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TwoFactorCode, User])],
  providers: [TelegramTwoFactorService],
  controllers: [TelegramTwoFactorController],
  exports: [TelegramTwoFactorService],
})
export class TelegramTwoFactorMicroModule implements TwoFactorMicroModule {
  type = 'two-factor' as const;
  
  config = {
    name: 'telegram-2fa',
    version: '1.0.0',
    description: 'Двухфакторная аутентификация через Telegram',
    dependencies: ['telegram-service'],
    enabled: true,
    priority: 10,
  };

  methods = ['telegram'];

  module = {
    imports: [TypeOrmModule.forFeature([TwoFactorCode, User])],
    providers: [TelegramTwoFactorService],
    controllers: [TelegramTwoFactorController],
    exports: [TelegramTwoFactorService],
  };

  services = [TelegramTwoFactorService];
  controllers = [TelegramTwoFactorController];
  providers = [TelegramTwoFactorService];
  exports = [TelegramTwoFactorService];

  getModuleName(): string {
    return 'telegram-2fa';
  }

  getModule(): any {
    return this.module;
  }

  getServices(): any[] {
    return this.services;
  }

  getControllers(): any[] {
    return this.controllers;
  }

  getProviders(): any[] {
    return this.providers;
  }

  getExports(): any[] {
    return this.exports;
  }
}

@Injectable()
export class TelegramTwoFactorMicroModuleService extends BaseAuthMicroModule {
  config = {
    name: 'telegram-2fa',
    version: '1.0.0',
    description: 'Двухфакторная аутентификация через Telegram',
    dependencies: ['telegram-service'],
    enabled: true,
    priority: 10,
  };

  async initialize(): Promise<void> {
    await super.initialize();
    console.log('📱 Telegram 2FA микромодуль готов к работе');
  }
}
