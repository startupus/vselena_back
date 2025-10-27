import { Injectable } from '@nestjs/common';
import { BaseMicroModule } from '../../../common/base/base-micro-module';
import { UIElement } from '../../../common/interfaces/ui-element.interface';

@Injectable()
export class ReferralMicroModule extends BaseMicroModule {
  readonly name = 'referral-system';
  readonly version = '1.0.0';
  readonly displayName = 'Реферальная система';
  readonly description = 'Система приглашений и рефералов';
  readonly isEnabled = true;
  readonly isSystem = false;
  readonly dependencies: string[] = [];
  readonly permissions = [
    'referral.create',
    'referral.use',
    'referral.view',
    'referral.manage',
  ];
  readonly uiElements: UIElement[] = [
    {
      id: 'referral-code-generator',
      component: 'ReferralCodeGenerator',
      path: '/referral/generate',
      displayName: 'Генератор реферальных кодов',
      description: 'Создание реферальных кодов для приглашения пользователей',
      requiredPermissions: ['referral.create'],
      requiredRoles: ['admin', 'super_admin'],
      conditions: {
        featureEnabled: 'referral-system',
      },
      priority: 100,
      isActive: true,
      metadata: {
        type: 'tool',
        category: 'referral',
      },
    },
    {
      id: 'referral-code-input',
      component: 'ReferralCodeInput',
      path: '/auth/register',
      displayName: 'Поле ввода реферального кода',
      description: 'Поле для ввода реферального кода при регистрации',
      requiredPermissions: [],
      requiredRoles: [],
      conditions: {
        featureEnabled: 'referral-system',
      },
      priority: 90,
      isActive: true,
      metadata: {
        type: 'form-field',
        category: 'auth',
      },
    },
    {
      id: 'referral-stats',
      component: 'ReferralStats',
      path: '/referral/stats',
      displayName: 'Статистика рефералов',
      description: 'Отображение статистики по рефералам',
      requiredPermissions: ['referral.view'],
      requiredRoles: ['admin', 'super_admin'],
      conditions: {
        featureEnabled: 'referral-system',
      },
      priority: 80,
      isActive: true,
      metadata: {
        type: 'dashboard',
        category: 'referral',
      },
    },
  ];
  readonly priority = 70;

  protected async onInitialize(): Promise<void> {
    this.logInitialization();
  }

  protected async onDestroy(): Promise<void> {
    this.logDestruction();
  }
}
