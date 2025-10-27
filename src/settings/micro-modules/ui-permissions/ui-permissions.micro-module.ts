import { Injectable } from '@nestjs/common';
import { BaseSystemMicroModule } from '../../../common/base/base-micro-module';
import { UIElement } from '../../../common/interfaces/ui-element.interface';

@Injectable()
export class UIPermissionsMicroModule extends BaseSystemMicroModule {
  readonly name = 'ui-permissions';
  readonly version = '1.0.0';
  readonly displayName = 'UI права доступа';
  readonly description = 'Управление отображением UI элементов по правам доступа';
  readonly isEnabled = true;
  readonly isSystem = true;
  readonly dependencies: string[] = [];
  readonly permissions = [
    'ui.elements.view',
    'ui.elements.create',
    'ui.elements.update',
    'ui.elements.delete',
    'ui.navigation.view',
  ];
  readonly uiElements: UIElement[] = [
    {
      id: 'ui-elements-manager',
      component: 'UIElementsManager',
      path: '/admin/ui-elements',
      displayName: 'Управление UI элементами',
      description: 'Создание и редактирование UI элементов',
      requiredPermissions: ['ui.elements.create', 'ui.elements.update'],
      requiredRoles: ['super_admin'],
      conditions: {},
      priority: 100,
      isActive: true,
      metadata: {
        type: 'admin-panel',
        category: 'system',
      },
    },
    {
      id: 'navigation-manager',
      component: 'NavigationManager',
      path: '/admin/navigation',
      displayName: 'Управление навигацией',
      description: 'Настройка навигационных меню',
      requiredPermissions: ['ui.navigation.view'],
      requiredRoles: ['super_admin'],
      conditions: {},
      priority: 90,
      isActive: true,
      metadata: {
        type: 'admin-panel',
        category: 'system',
      },
    },
    {
      id: 'permission-matrix',
      component: 'PermissionMatrix',
      path: '/admin/permissions',
      displayName: 'Матрица прав доступа',
      description: 'Визуализация прав доступа для ролей',
      requiredPermissions: ['ui.elements.view'],
      requiredRoles: ['super_admin'],
      conditions: {},
      priority: 80,
      isActive: true,
      metadata: {
        type: 'admin-panel',
        category: 'system',
      },
    },
  ];
  readonly priority = 50;
  readonly systemSettings = {
    'ui.default_theme': 'light',
    'ui.sidebar_collapsed': false,
    'ui.show_breadcrumbs': true,
    'ui.animation_enabled': true,
  };

  protected async onInitialize(): Promise<void> {
    this.logInitialization();
  }

  protected async onDestroy(): Promise<void> {
    this.logDestruction();
  }

  async validateSystemSettings(settings: Record<string, any>): Promise<boolean> {
    // Валидация системных настроек UI
    const validKeys = Object.keys(this.systemSettings);
    const providedKeys = Object.keys(settings);
    
    return providedKeys.every(key => validKeys.includes(key));
  }

  async applySystemSettings(settings: Record<string, any>): Promise<void> {
    console.log('Applying UI system settings:', settings);
    // Здесь должна быть логика применения настроек
  }
}
