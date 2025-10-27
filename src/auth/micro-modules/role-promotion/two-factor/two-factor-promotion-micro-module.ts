import { Module, Injectable } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolePromotionMicroModule } from '../../base/auth-micro-module.interface';
import { BaseAuthMicroModule } from '../../base/auth-micro-module.abstract';
import { TwoFactorPromotionService } from './two-factor-promotion.service';
import { TwoFactorPromotionController } from './two-factor-promotion.controller';
import { User } from '../../../../users/entities/user.entity';
import { Role } from '../../../../rbac/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  providers: [TwoFactorPromotionService],
  controllers: [TwoFactorPromotionController],
  exports: [TwoFactorPromotionService],
})
export class TwoFactorPromotionMicroModule implements RolePromotionMicroModule {
  type = 'role-promotion' as const;
  
  config = {
    name: 'two-factor-promotion',
    version: '1.0.0',
    description: 'Автоматическое повышение роли при включении 2FA',
    dependencies: ['user-role-management'],
    enabled: true,
    priority: 40,
  };

  conditions = ['two-factor-enabled'];

  module = {
    imports: [TypeOrmModule.forFeature([User, Role])],
    providers: [TwoFactorPromotionService],
    controllers: [TwoFactorPromotionController],
    exports: [TwoFactorPromotionService],
  };

  services = [TwoFactorPromotionService];
  controllers = [TwoFactorPromotionController];
  providers = [TwoFactorPromotionService];
  exports = [TwoFactorPromotionService];

  getModuleName(): string {
    return 'two-factor-promotion';
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
export class TwoFactorPromotionMicroModuleService extends BaseAuthMicroModule {
  config = {
    name: 'two-factor-promotion',
    version: '1.0.0',
    description: 'Автоматическое повышение роли при включении 2FA',
    dependencies: ['user-role-management'],
    enabled: true,
    priority: 40,
  };

  async initialize(): Promise<void> {
    await super.initialize();
    console.log('🔐 Two-factor promotion микромодуль готов к работе');
  }
}
