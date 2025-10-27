import { Module, Injectable } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { TwoFactorMicroModule } from '../../base/auth-micro-module.interface';
import { BaseAuthMicroModule } from '../../base/auth-micro-module.abstract';
import { EmailTwoFactorService } from './email-2fa.service';
import { EmailTwoFactorController } from './email-2fa.controller';
import { TwoFactorCode } from '../../../entities/two-factor-code.entity';
import { User } from '../../../../users/entities/user.entity';
import { RefreshToken } from '../../../entities/refresh-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TwoFactorCode, User, RefreshToken]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [EmailTwoFactorService],
  controllers: [EmailTwoFactorController],
  exports: [EmailTwoFactorService],
})
export class EmailTwoFactorMicroModule implements TwoFactorMicroModule {
  type = 'two-factor' as const;
  
  config = {
    name: 'email-2fa',
    version: '1.0.0',
    description: 'Двухфакторная аутентификация через Email',
    dependencies: ['email-service'],
    enabled: true,
    priority: 10,
  };

  methods = ['email'];

  module = {
    imports: [
      TypeOrmModule.forFeature([TwoFactorCode, User, RefreshToken]),
      JwtModule.register({
        secret: process.env.JWT_SECRET || 'default-secret',
        signOptions: { expiresIn: '15m' },
      }),
    ],
    providers: [EmailTwoFactorService],
    controllers: [EmailTwoFactorController],
    exports: [EmailTwoFactorService],
  };

  services = [EmailTwoFactorService];
  controllers = [EmailTwoFactorController];
  providers = [EmailTwoFactorService];
  exports = [EmailTwoFactorService];

  getModuleName(): string {
    return 'email-2fa';
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
export class EmailTwoFactorMicroModuleService extends BaseAuthMicroModule {
  config = {
    name: 'email-2fa',
    version: '1.0.0',
    description: 'Двухфакторная аутентификация через Email',
    dependencies: ['email-service'],
    enabled: true,
    priority: 10,
  };

  async initialize(): Promise<void> {
    await super.initialize();
    console.log('📧 Email 2FA микромодуль готов к работе');
  }
}
