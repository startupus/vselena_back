import { Injectable } from '@nestjs/common';
import { BaseAuthMicroModule } from '../../../common/base/base-micro-module';
import { UIElement } from '../../../common/interfaces/ui-element.interface';

@Injectable()
export class EmailAuthMicroModule extends BaseAuthMicroModule {
  readonly name = 'email-auth';
  readonly version = '1.0.0';
  readonly displayName = 'Авторизация по email';
  readonly description = 'Вход в систему по email и паролю';
  readonly isEnabled = true;
  readonly isSystem = true;
  readonly dependencies: string[] = [];
  readonly permissions = [
    'auth.email.login',
    'auth.email.register',
    'auth.email.reset-password',
  ];
  readonly uiElements: UIElement[] = [
    {
      id: 'email-login-form',
      component: 'EmailLoginForm',
      path: '/auth/login',
      displayName: 'Форма входа по email',
      description: 'Форма для входа в систему по email и паролю',
      requiredPermissions: [],
      requiredRoles: [],
      conditions: {
        featureEnabled: 'email-auth',
      },
      priority: 100,
      isActive: true,
      metadata: {
        type: 'form',
        category: 'auth',
      },
    },
    {
      id: 'email-register-form',
      component: 'EmailRegisterForm',
      path: '/auth/register',
      displayName: 'Форма регистрации по email',
      description: 'Форма для регистрации нового пользователя',
      requiredPermissions: ['users.create'],
      requiredRoles: ['admin', 'super_admin'],
      conditions: {
        featureEnabled: 'email-auth',
      },
      priority: 90,
      isActive: true,
      metadata: {
        type: 'form',
        category: 'auth',
      },
    },
    {
      id: 'password-reset-form',
      component: 'PasswordResetForm',
      path: '/auth/reset-password',
      displayName: 'Форма сброса пароля',
      description: 'Форма для сброса пароля по email',
      requiredPermissions: [],
      requiredRoles: [],
      conditions: {
        featureEnabled: 'email-auth',
      },
      priority: 80,
      isActive: true,
      metadata: {
        type: 'form',
        category: 'auth',
      },
    },
  ];
  readonly priority = 100;
  readonly authMethods = ['email'];

  protected async onInitialize(): Promise<void> {
    // Инициализация модуля email аутентификации
    this.logInitialization();
  }

  protected async onDestroy(): Promise<void> {
    // Очистка ресурсов модуля
    this.logDestruction();
  }

  async validateCredentials(credentials: any): Promise<boolean> {
    // Валидация email и пароля
    const { email, password } = credentials;
    return !!(email && password && this.isValidEmail(email));
  }

  async generateTokens(user: any): Promise<{ accessToken: string; refreshToken: string }> {
    // Генерация токенов для пользователя
    // Здесь должна быть логика генерации JWT токенов
    return {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
