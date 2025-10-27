import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UIElement } from './entities/ui-element.entity';
import { UIGroup } from './entities/ui-group.entity';
import { NavigationMenu } from './entities/navigation-menu.entity';
import { User } from '../../../users/entities/user.entity';
import { PermissionsUtilsService } from '../../../common/services/permissions-utils.service';

@Injectable()
export class UIPermissionsService {
  constructor(
    @InjectRepository(UIElement)
    private uiElementsRepo: Repository<UIElement>,
    @InjectRepository(UIGroup)
    private uiGroupsRepo: Repository<UIGroup>,
    @InjectRepository(NavigationMenu)
    private navigationMenusRepo: Repository<NavigationMenu>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private permissionsUtils: PermissionsUtilsService,
  ) {}

  /**
   * Получение UI элементов для пользователя
   */
  async getUIElementsForUser(userId: string): Promise<UIElement[]> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['userRoleAssignments', 'userRoleAssignments.role', 'userRoleAssignments.organizationRole', 'userRoleAssignments.teamRole'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const userRoles = user.userRoleAssignments?.map(assignment => {
      if (assignment.role) return assignment.role.name;
      if (assignment.organizationRole) return assignment.organizationRole.name;
      if (assignment.teamRole) return assignment.teamRole.name;
      return null;
    }).filter((name): name is string => Boolean(name)) || [];
    const userPermissions = this.permissionsUtils.extractUserPermissions(user);

    const allElements = await this.uiElementsRepo.find({
      where: { isActive: true },
      relations: ['group'],
      order: { priority: 'ASC' },
    });

    const userElements: UIElement[] = [];

    for (const element of allElements) {
      if (await this.canUserSeeElement(element, userRoles, userPermissions, user)) {
        userElements.push(element);
      }
    }

    return userElements;
  }

  /**
   * Получение навигационного меню для пользователя
   */
  async getNavigationMenuForUser(userId: string, menuId: string): Promise<NavigationMenu | null> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['userRoleAssignments', 'userRoleAssignments.role', 'userRoleAssignments.organizationRole', 'userRoleAssignments.teamRole'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const menu = await this.navigationMenusRepo.findOne({
      where: { menuId, isActive: true },
    });

    if (!menu) {
      return null;
    }

    const userRoles = user.userRoleAssignments?.map(assignment => {
      if (assignment.role) return assignment.role.name;
      if (assignment.organizationRole) return assignment.organizationRole.name;
      if (assignment.teamRole) return assignment.teamRole.name;
      return null;
    }).filter((name): name is string => Boolean(name)) || [];
    const userPermissions = this.permissionsUtils.extractUserPermissions(user);

    // Фильтруем элементы меню по правам пользователя
    const filteredItems: any[] = [];
    for (const item of menu.items) {
      if (await this.canUserSeeMenuItem(item, userRoles, userPermissions, user)) {
        filteredItems.push(item);
      }
    }

    return {
      ...menu,
      items: filteredItems,
    };
  }

  /**
   * Создание UI элемента (только для super_admin)
   */
  async createUIElement(
    elementData: Partial<UIElement>,
    userId: string,
  ): Promise<UIElement> {
    await this.checkSuperAdminAccess(userId);

    const element = this.uiElementsRepo.create(elementData);
    return this.uiElementsRepo.save(element);
  }

  /**
   * Обновление UI элемента (только для super_admin)
   */
  async updateUIElement(
    elementId: string,
    updateData: Partial<UIElement>,
    userId: string,
  ): Promise<UIElement> {
    await this.checkSuperAdminAccess(userId);

    const element = await this.uiElementsRepo.findOne({
      where: { elementId },
    });

    if (!element) {
      throw new NotFoundException('UI элемент не найден');
    }

    Object.assign(element, updateData);
    return this.uiElementsRepo.save(element);
  }

  /**
   * Удаление UI элемента (только для super_admin)
   */
  async deleteUIElement(elementId: string, userId: string): Promise<void> {
    await this.checkSuperAdminAccess(userId);

    const element = await this.uiElementsRepo.findOne({
      where: { elementId },
    });

    if (!element) {
      throw new NotFoundException('UI элемент не найден');
    }

    await this.uiElementsRepo.remove(element);
  }

  /**
   * Проверка, может ли пользователь видеть элемент
   */
  private async canUserSeeElement(
    element: UIElement,
    userRoles: string[],
    userPermissions: string[],
    user: User,
  ): Promise<boolean> {
    // Проверяем права доступа
    if (element.requiredPermissions.length > 0) {
      const hasPermission = element.requiredPermissions.some(permission =>
        userPermissions.includes(permission)
      );
      if (!hasPermission) return false;
    }

    // Проверяем роли
    if (element.requiredRoles.length > 0) {
      const hasRole = element.requiredRoles.some(role =>
        userRoles.includes(role)
      );
      if (!hasRole) return false;
    }

    // Проверяем условия
    if (element.conditions && Object.keys(element.conditions).length > 0) {
      if (!await this.checkUIConditions(element.conditions, userRoles, userPermissions, user)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Проверка, может ли пользователь видеть элемент меню
   */
  private async canUserSeeMenuItem(
    item: any,
    userRoles: string[],
    userPermissions: string[],
    user: User,
  ): Promise<boolean> {
    // Проверяем права доступа
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      const hasPermission = item.requiredPermissions.some((permission: string) =>
        userPermissions.includes(permission)
      );
      if (!hasPermission) return false;
    }

    // Проверяем роли
    if (item.requiredRoles && item.requiredRoles.length > 0) {
      const hasRole = item.requiredRoles.some((role: string) =>
        userRoles.includes(role)
      );
      if (!hasRole) return false;
    }

    // Проверяем условия
    if (item.conditions && Object.keys(item.conditions).length > 0) {
      if (!await this.checkUIConditions(item.conditions, userRoles, userPermissions, user)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Проверка условий UI элемента
   */
  private async checkUIConditions(
    conditions: Record<string, any>,
    userRoles: string[],
    userPermissions: string[],
    user: User,
  ): Promise<boolean> {
    // Проверяем включенность функции
    if (conditions.featureEnabled) {
      // Здесь должна быть проверка через FeatureSettings
      // Пока возвращаем true
    }

    // Проверяем роль пользователя
    if (conditions.userHasRole) {
      if (!userRoles.includes(conditions.userHasRole)) return false;
    }

    // Проверяем право пользователя
    if (conditions.userHasPermission) {
      if (!userPermissions.includes(conditions.userHasPermission)) return false;
    }

    // Проверяем организацию
    if (conditions.userInOrganization !== undefined) {
      const hasOrganization = !!(user.organizations && user.organizations.length > 0);
      if (hasOrganization !== conditions.userInOrganization) return false;
    }

    // Проверяем команду
    if (conditions.userInTeam !== undefined) {
      const hasTeam = !!(user.teams && user.teams.length > 0);
      if (hasTeam !== conditions.userInTeam) return false;
    }

    return true;
  }

  /**
   * Извлечение прав пользователя
   */

  /**
   * Проверка прав super_admin
   */
  private async checkSuperAdminAccess(userId: string): Promise<void> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['userRoleAssignments', 'userRoleAssignments.role'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const hasSuperAdminRole = user.userRoleAssignments?.some(
      assignment => assignment.role?.name === 'super_admin'
    );

    if (!hasSuperAdminRole) {
      throw new ForbiddenException('Только super_admin может управлять UI элементами');
    }
  }
}
