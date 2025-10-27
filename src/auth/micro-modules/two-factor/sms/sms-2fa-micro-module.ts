import { Module, Injectable } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TwoFactorMicroModule } from '../../base/auth-micro-module.interface';
import { BaseAuthMicroModule } from '../../base/auth-micro-module.abstract';
import { SmsTwoFactorService } from './sms-2fa.service';
import { SmsTwoFactorController } from './sms-2fa.controller';
import { TwoFactorCode } from '../../../entities/two-factor-code.entity';
import { User } from '../../../../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TwoFactorCode, User])],
  providers: [SmsTwoFactorService],
  controllers: [SmsTwoFactorController],
  exports: [SmsTwoFactorService],
})
export class SmsTwoFactorMicroModule implements TwoFactorMicroModule {
  type = 'two-factor' as const;
  
  config = {
    name: 'sms-2fa',
    version: '1.0.0',
    description: 'Двухфакторная аутентификация через SMS',
    dependencies: ['sms-service'],
    enabled: true,
    priority: 10,
  };

  methods = ['sms'];

  module = {
    imports: [TypeOrmModule.forFeature([TwoFactorCode, User])],
    providers: [SmsTwoFactorService],
    controllers: [SmsTwoFactorController],
    exports: [SmsTwoFactorService],
  };

  services = [SmsTwoFactorService];
  controllers = [SmsTwoFactorController];
  providers = [SmsTwoFactorService];
  exports = [SmsTwoFactorService];

  getModuleName(): string {
    return 'sms-2fa';
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
export class SmsTwoFactorMicroModuleService extends BaseAuthMicroModule {
  config = {
    name: 'sms-2fa',
    version: '1.0.0',
    description: 'Двухфакторная аутентификация через SMS',
    dependencies: ['sms-service'],
    enabled: true,
    priority: 10,
  };

  async initialize(): Promise<void> {
    await super.initialize();
    console.log('📱 SMS 2FA микромодуль готов к работе');
  }
}
