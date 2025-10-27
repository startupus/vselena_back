import { Module, Injectable } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolePromotionMicroModule } from '../../base/auth-micro-module.interface';
import { BaseAuthMicroModule } from '../../base/auth-micro-module.abstract';
import { EmailVerificationPromotionService } from './email-verification-promotion.service';
import { EmailVerificationPromotionController } from './email-verification-promotion.controller';
import { User } from '../../../../users/entities/user.entity';
import { Role } from '../../../../rbac/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  providers: [EmailVerificationPromotionService],
  controllers: [EmailVerificationPromotionController],
  exports: [EmailVerificationPromotionService],
})
export class EmailVerificationPromotionMicroModule implements RolePromotionMicroModule {
  type = 'role-promotion' as const;
  
  config = {
    name: 'email-verification-promotion',
    version: '1.0.0',
    description: 'Автоматическое повышение роли при подтверждении email',
    dependencies: ['user-role-management'],
    enabled: true,
    priority: 20,
  };

  conditions = ['email-verified'];

  module = {
    imports: [TypeOrmModule.forFeature([User, Role])],
    providers: [EmailVerificationPromotionService],
    controllers: [EmailVerificationPromotionController],
    exports: [EmailVerificationPromotionService],
  };

  services = [EmailVerificationPromotionService];
  controllers = [EmailVerificationPromotionController];
  providers = [EmailVerificationPromotionService];
  exports = [EmailVerificationPromotionService];

  getModuleName(): string {
    return 'email-verification-promotion';
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
export class EmailVerificationPromotionMicroModuleService extends BaseAuthMicroModule {
  config = {
    name: 'email-verification-promotion',
    version: '1.0.0',
    description: 'Автоматическое повышение роли при подтверждении email',
    dependencies: ['user-role-management'],
    enabled: true,
    priority: 20,
  };

  async initialize(): Promise<void> {
    await super.initialize();
    console.log('📧 Email verification promotion микромодуль готов к работе');
  }
}
