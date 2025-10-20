import { Module, Injectable } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolePromotionMicroModule } from '../../base/auth-micro-module.interface';
import { BaseAuthMicroModule } from '../../base/auth-micro-module.abstract';
import { PhoneVerificationPromotionService } from './phone-verification-promotion.service';
import { PhoneVerificationPromotionController } from './phone-verification-promotion.controller';
import { User } from '../../../../users/entities/user.entity';
import { Role } from '../../../../rbac/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  providers: [PhoneVerificationPromotionService],
  controllers: [PhoneVerificationPromotionController],
  exports: [PhoneVerificationPromotionService],
})
export class PhoneVerificationPromotionMicroModule implements RolePromotionMicroModule {
  type = 'role-promotion' as const;
  
  config = {
    name: 'phone-verification-promotion',
    version: '1.0.0',
    description: 'Автоматическое повышение роли при подтверждении номера телефона',
    dependencies: ['user-role-management'],
    enabled: true,
    priority: 30,
  };

  conditions = ['phone-verified'];

  module = {
    imports: [TypeOrmModule.forFeature([User, Role])],
    providers: [PhoneVerificationPromotionService],
    controllers: [PhoneVerificationPromotionController],
    exports: [PhoneVerificationPromotionService],
  };

  services = [PhoneVerificationPromotionService];
  controllers = [PhoneVerificationPromotionController];
  providers = [PhoneVerificationPromotionService];
  exports = [PhoneVerificationPromotionService];

  getModuleName(): string {
    return 'phone-verification-promotion';
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
export class PhoneVerificationPromotionMicroModuleService extends BaseAuthMicroModule {
  config = {
    name: 'phone-verification-promotion',
    version: '1.0.0',
    description: 'Автоматическое повышение роли при подтверждении номера телефона',
    dependencies: ['user-role-management'],
    enabled: true,
    priority: 30,
  };

  async initialize(): Promise<void> {
    await super.initialize();
    console.log('📱 Phone verification promotion микромодуль готов к работе');
  }
}
