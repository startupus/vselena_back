import { Injectable } from '@nestjs/common';
import { BaseManagementMicroModule } from '../../../common/base/base-micro-module';
import { UIElement } from '../../../common/interfaces/ui-element.interface';

@Injectable()
export class CustomRolesMicroModule extends BaseManagementMicroModule {
  readonly name = 'custom-roles';
  readonly version = '1.0.0';
  readonly displayName = 'Кастомные роли';
  readonly description = 'Создание и управление пользовательскими ролями';
  readonly isEnabled = true;
  readonly isSystem = false;
  readonly dependencies: string[] = [];
  readonly permissions = [
    'roles.create',
    'roles.update',
    'roles.delete',
    'roles.assign',
    'roles.view',
  ];
  readonly uiElements: UIElement[] = [
    {
      id: 'create-role-form',
      component: 'CreateRoleForm',
      path: '/roles/create',
      displayName: 'Форма создания роли',
      description: 'Создание новой пользовательской роли',
      requiredPermissions: ['roles.create'],
      requiredRoles: ['super_admin'],
      conditions: {
        featureEnabled: 'custom-roles',
      },
      priority: 100,
      isActive: true,
      metadata: {
        type: 'form',
        category: 'roles',
      },
    },
    {
      id: 'edit-role-form',
      component: 'EditRoleForm',
      path: '/roles/:id/edit',
      displayName: 'Форма редактирования роли',
      description: 'Редактирование существующей роли',
      requiredPermissions: ['roles.update'],
      requiredRoles: ['super_admin'],
      conditions: {
        featureEnabled: 'custom-roles',
      },
      priority: 90,
      isActive: true,
      metadata: {
        type: 'form',
        category: 'roles',
      },
    },
    {
      id: 'role-permissions-manager',
      component: 'RolePermissionsManager',
      path: '/roles/:id/permissions',
      displayName: 'Управление правами роли',
      description: 'Назначение и отзыв прав для роли',
      requiredPermissions: ['roles.update'],
      requiredRoles: ['super_admin'],
      conditions: {
        featureEnabled: 'custom-roles',
      },
      priority: 80,
      isActive: true,
      metadata: {
        type: 'manager',
        category: 'roles',
      },
    },
    {
      id: 'assign-role-form',
      component: 'AssignRoleForm',
      path: '/users/:id/roles',
      displayName: 'Форма назначения роли',
      description: 'Назначение роли пользователю',
      requiredPermissions: ['roles.assign'],
      requiredRoles: ['admin', 'super_admin'],
      conditions: {
        featureEnabled: 'custom-roles',
      },
      priority: 70,
      isActive: true,
      metadata: {
        type: 'form',
        category: 'users',
      },
    },
    {
      id: 'roles-list',
      component: 'RolesList',
      path: '/roles',
      displayName: 'Список ролей',
      description: 'Отображение всех ролей в системе',
      requiredPermissions: ['roles.view'],
      requiredRoles: ['admin', 'super_admin'],
      conditions: {
        featureEnabled: 'custom-roles',
      },
      priority: 60,
      isActive: true,
      metadata: {
        type: 'list',
        category: 'roles',
      },
    },
  ];
  readonly priority = 60;
  readonly managedEntities = ['roles', 'permissions'];

  protected async onInitialize(): Promise<void> {
    this.logInitialization();
  }

  protected async onDestroy(): Promise<void> {
    this.logDestruction();
  }

  async canPerformOperation(operation: string, user: any, target?: any): Promise<boolean> {
    const userRoles = user.roles || [];
    
    // super_admin может выполнять все операции
    if (userRoles.includes('super_admin')) {
      return true;
    }
    
    // admin может управлять только не системными ролями
    if (userRoles.includes('admin')) {
      if (operation === 'create' || operation === 'view') {
        return true;
      }
      if (operation === 'update' || operation === 'delete') {
        return target && !target.isSystem;
      }
    }
    
    return false;
  }
}
