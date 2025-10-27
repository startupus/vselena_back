import { Injectable } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

/**
 * Утилитарный сервис для работы с правами доступа
 */
@Injectable()
export class PermissionsUtilsService {
  /**
   * Извлечение прав пользователя из ролей
   */
  extractUserPermissions(user: User): string[] {
    const permissions = new Set<string>();
    
    user.userRoleAssignments?.forEach(assignment => {
      assignment.role?.permissions?.forEach(permission => {
        permissions.add(permission.name);
      });
    });

    return Array.from(permissions);
  }

  /**
   * Извлечение прав из массива ролей
   */
  extractPermissionsFromRoles(roles: any[]): string[] {
    const permissions = new Set<string>();
    
    roles.forEach(role => {
      role.permissions?.forEach((permission: any) => {
        permissions.add(permission.name);
      });
    });

    return Array.from(permissions);
  }

  /**
   * Извлечение ролей пользователя
   */
  extractUserRoles(user: User): string[] {
    return user.userRoleAssignments?.map(assignment => {
      if (assignment.role) return assignment.role.name;
      if (assignment.organizationRole) return assignment.organizationRole.name;
      if (assignment.teamRole) return assignment.teamRole.name;
      return null;
    }).filter((name): name is string => Boolean(name)) || [];
  }

  /**
   * Проверка наличия роли у пользователя
   */
  userHasRole(user: User, roleName: string): boolean {
    const userRoles = this.extractUserRoles(user);
    return userRoles.includes(roleName);
  }

  /**
   * Проверка наличия права у пользователя
   */
  userHasPermission(user: User, permissionName: string): boolean {
    const userPermissions = this.extractUserPermissions(user);
    return userPermissions.includes(permissionName);
  }

  /**
   * Проверка, является ли пользователь super_admin
   */
  isSuperAdmin(user: User): boolean {
    return this.userHasRole(user, 'super_admin');
  }

  /**
   * Проверка, является ли пользователь admin
   */
  isAdmin(user: User): boolean {
    return this.userHasRole(user, 'admin');
  }

  /**
   * Проверка, может ли пользователь управлять другими ролями
   */
  canManageRoles(user: User, targetRoleName: string): boolean {
    if (this.isSuperAdmin(user)) {
      return true;
    }

    if (this.isAdmin(user)) {
      return ['admin', 'viewer'].includes(targetRoleName);
    }

    return false;
  }

  /**
   * Проверка, может ли пользователь управлять UI элементами
   */
  canManageUI(user: User): boolean {
    return this.isSuperAdmin(user);
  }

  /**
   * Проверка, может ли пользователь управлять системными настройками
   */
  canManageSystemSettings(user: User): boolean {
    return this.isSuperAdmin(user);
  }
}
