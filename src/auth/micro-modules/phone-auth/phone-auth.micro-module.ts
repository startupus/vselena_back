import { Injectable } from '@nestjs/common';
import { BaseAuthMicroModule } from '../../../common/base/base-micro-module';
import { UIElement } from '../../../common/interfaces/ui-element.interface';

@Injectable()
export class PhoneAuthMicroModule extends BaseAuthMicroModule {
  readonly name = 'phone-auth';
  readonly version = '1.0.0';
  readonly displayName = 'Авторизация по телефону';
  readonly description = 'Вход в систему по номеру телефона и SMS коду';
  readonly isEnabled = false; // По умолчанию отключена
  readonly isSystem = false;
  readonly dependencies: string[] = [];
  readonly permissions = [
    'auth.phone.login',
    'auth.phone.register',
    'auth.phone.send-code',
    'auth.phone.verify-code',
  ];
  readonly uiElements: UIElement[] = [
    {
      id: 'phone-login-form',
      component: 'PhoneLoginForm',
      path: '/auth/phone/login',
      displayName: 'Форма входа по телефону',
      description: 'Форма для входа в систему по номеру телефона',
      requiredPermissions: [],
      requiredRoles: [],
      conditions: {
        featureEnabled: 'phone-auth',
      },
      priority: 100,
      isActive: true,
      metadata: {
        type: 'form',
        category: 'auth',
      },
    },
    {
      id: 'phone-register-form',
      component: 'PhoneRegisterForm',
      path: '/auth/phone/register',
      displayName: 'Форма регистрации по телефону',
      description: 'Форма для регистрации нового пользователя по телефону',
      requiredPermissions: ['users.create'],
      requiredRoles: ['admin', 'super_admin'],
      conditions: {
        featureEnabled: 'phone-auth',
      },
      priority: 90,
      isActive: true,
      metadata: {
        type: 'form',
        category: 'auth',
      },
    },
    {
      id: 'phone-verify-form',
      component: 'PhoneVerifyForm',
      path: '/auth/phone/verify',
      displayName: 'Форма верификации телефона',
      description: 'Форма для подтверждения номера телефона',
      requiredPermissions: [],
      requiredRoles: [],
      conditions: {
        featureEnabled: 'phone-auth',
      },
      priority: 80,
      isActive: true,
      metadata: {
        type: 'form',
        category: 'auth',
      },
    },
  ];
  readonly priority = 90;
  readonly authMethods = ['phone'];

  protected async onInitialize(): Promise<void> {
    this.logInitialization();
  }

  protected async onDestroy(): Promise<void> {
    this.logDestruction();
  }

  async validateCredentials(credentials: any): Promise<boolean> {
    const { phone, code } = credentials;
    return !!(phone && code && this.isValidPhone(phone));
  }

  async generateTokens(user: any): Promise<{ accessToken: string; refreshToken: string }> {
    return {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };
  }

  private isValidPhone(phone: string): boolean {
    // Простая валидация российского номера
    const phoneRegex = /^\+7\d{10}$/;
    return phoneRegex.test(phone);
  }
}
