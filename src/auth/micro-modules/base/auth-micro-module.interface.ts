import { ModuleMetadata, DynamicModule } from '@nestjs/common';

export interface AuthMicroModuleConfig {
  name: string;
  version: string;
  description: string;
  dependencies?: string[];
  enabled: boolean;
  priority: number; // Чем выше, тем приоритетнее
}

export interface AuthMicroModule {
  config: AuthMicroModuleConfig;
  module: ModuleMetadata;
  services?: any[];
  controllers?: any[];
  providers?: any[];
  exports?: any[];
  getModuleName(): string;
  getModule(): DynamicModule;
  getServices(): any[];
  getControllers(): any[];
  getProviders(): any[];
  getExports(): any[];
}

// Для обратной совместимости
export type { AuthMicroModule as IAuthMicroModule };

export interface TwoFactorMicroModule extends AuthMicroModule {
  type: 'two-factor';
  methods: string[]; // ['email', 'sms', 'telegram', 'totp']
}

export interface RolePromotionMicroModule extends AuthMicroModule {
  type: 'role-promotion';
  conditions: string[]; // ['email-verified', 'phone-verified', 'payment-verified']
}

export interface SocialAuthMicroModule extends AuthMicroModule {
  type: 'social-auth';
  providers: string[]; // ['google', 'yandex', 'vk', 'ok', 'mailru']
}

export type AuthMicroModuleType = 'two-factor' | 'role-promotion' | 'social-auth' | 'password-reset' | 'audit' | 'notification';
