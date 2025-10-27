import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../rbac/entities/role.entity';

export interface RolePromotionCondition {
  id: string;
  name: string;
  description: string;
  checkCondition: (user: User) => Promise<boolean>;
  targetRole: string;
  priority: number; // Чем выше, тем приоритетнее
}

@Injectable()
export class UserRoleManagementService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Role) private rolesRepo: Repository<Role>,
  ) {}

  /**
   * Повышение роли пользователя (только для супер-админов)
   */
  async promoteUserRole(
    userId: string,
    newRoleName: string,
    promotedBy: string,
  ): Promise<User> {
    // Проверяем, что промоутер - супер-админ
    const promoter = await this.usersRepo.findOne({
      where: { id: promotedBy },
      relations: ['roles'],
    });

    if (!promoter) {
      throw new NotFoundException('Промоутер не найден');
    }

    const isSuperAdmin = promoter.userRoleAssignments?.some(assignment => 
      assignment.role && assignment.role.name === 'super_admin'
    ) || false;
    if (!isSuperAdmin) {
      throw new ForbiddenException('Только супер-админы могут повышать роли');
    }

    // Находим пользователя и новую роль
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const newRole = await this.rolesRepo.findOne({
      where: { name: newRoleName },
    });

    if (!newRole) {
      throw new NotFoundException('Роль не найдена');
    }

    // Удаляем старые роли (кроме системных, которые нельзя удалить)
    const systemRoles = ['super_admin', 'admin', 'manager', 'editor', 'viewer'];
    const removableRoles = user.userRoleAssignments?.filter(assignment => 
      assignment.role && !systemRoles.includes(assignment.role.name)
    ) || [];
    
    for (const role of removableRoles) {
      await this.usersRepo
        .createQueryBuilder()
        .relation(User, 'roles')
        .of(userId)
        .remove(role.id);
    }

    // Добавляем новую роль
    await this.usersRepo
      .createQueryBuilder()
      .relation(User, 'roles')
      .of(userId)
      .add(newRole.id);

    console.log(`🎯 Роль пользователя ${user.email} повышена до ${newRoleName} пользователем ${promoter.email}`);

    // Возвращаем обновленного пользователя
    const updatedUser = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });
    
    if (!updatedUser) {
      throw new NotFoundException('Пользователь не найден');
    }
    
    return updatedUser;
  }

  /**
   * Понижение роли пользователя (только для супер-админов)
   */
  async demoteUserRole(
    userId: string,
    roleName: string,
    demotedBy: string,
  ): Promise<User> {
    // Проверяем, что демоутер - супер-админ
    const demoter = await this.usersRepo.findOne({
      where: { id: demotedBy },
      relations: ['roles'],
    });

    if (!demoter) {
      throw new NotFoundException('Демоутер не найден');
    }

    const isSuperAdmin = demoter.userRoleAssignments?.some(assignment => 
      assignment.role && assignment.role.name === 'super_admin'
    ) || false;
    if (!isSuperAdmin) {
      throw new ForbiddenException('Только супер-админы могут понижать роли');
    }

    // Находим пользователя и роль для удаления
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const roleToRemove = user.userRoleAssignments?.find(assignment => 
      assignment.role && assignment.role.name === roleName
    );
    if (!roleToRemove) {
      throw new NotFoundException('Роль не найдена у пользователя');
    }

    // Нельзя удалить супер-админа
    if (roleName === 'super_admin') {
      throw new ForbiddenException('Нельзя удалить роль супер-админа');
    }

    // Удаляем роль
    await this.usersRepo
      .createQueryBuilder()
      .relation(User, 'roles')
      .of(userId)
      .remove(roleToRemove.id);

    console.log(`📉 Роль ${roleName} удалена у пользователя ${user.email} пользователем ${demoter.email}`);

    // Возвращаем обновленного пользователя
    const updatedUser = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });
    
    if (!updatedUser) {
      throw new NotFoundException('Пользователь не найден');
    }
    
    return updatedUser;
  }

  /**
   * Проверка и применение условий для автоматического повышения ролей
   */
  async checkAndApplyRolePromotions(userId: string): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['roles', 'organization', 'team'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Получаем все условия повышения ролей
    const conditions = this.getRolePromotionConditions();

    // Сортируем по приоритету (высший приоритет первым)
    conditions.sort((a, b) => b.priority - a.priority);

    // Проверяем каждое условие
    for (const condition of conditions) {
      try {
        const shouldPromote = await condition.checkCondition(user);
        if (shouldPromote) {
          console.log(`🎯 Применяется условие повышения роли: ${condition.name}`);
          await this.promoteUserRole(userId, condition.targetRole, 'system');
          break; // Применяем только первое подходящее условие
        }
      } catch (error) {
        console.error(`❌ Ошибка проверки условия ${condition.name}:`, error.message);
      }
    }

    // Возвращаем обновленного пользователя
    const updatedUser = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });
    
    if (!updatedUser) {
      throw new NotFoundException('Пользователь не найден');
    }
    
    return updatedUser;
  }

  /**
   * Получение всех условий для автоматического повышения ролей
   * ЗАГОТОВКИ для будущих условий
   */
  private getRolePromotionConditions(): RolePromotionCondition[] {
    return [
      {
        id: 'email_verified',
        name: 'Подтверждение email',
        description: 'Пользователь подтвердил свой email адрес',
        targetRole: 'editor',
        priority: 10,
        checkCondition: async (user: User) => {
          return user.emailVerified === true;
        },
      },
      {
        id: 'phone_verified',
        name: 'Подтверждение телефона',
        description: 'Пользователь подтвердил свой номер телефона',
        targetRole: 'editor',
        priority: 15,
        checkCondition: async (user: User) => {
          return user.phoneVerified === true;
        },
      },
      {
        id: 'two_factor_enabled',
        name: 'Включена двухфакторная аутентификация',
        description: 'Пользователь настроил 2FA',
        targetRole: 'editor',
        priority: 20,
        checkCondition: async (user: User) => {
          return user.twoFactorEnabled === true;
        },
      },
      {
        id: 'team_member',
        name: 'Член команды',
        description: 'Пользователь добавлен в команду',
        targetRole: 'manager',
        priority: 30,
        checkCondition: async (user: User) => {
          return user.teams && user.teams.length > 0;
        },
      },
      {
        id: 'organization_admin',
        name: 'Администратор организации',
        description: 'Пользователь назначен администратором организации',
        targetRole: 'admin',
        priority: 40,
        checkCondition: async (user: User) => {
          // Здесь можно добавить логику проверки, является ли пользователь админом организации
          return false; // Пока не реализовано
        },
      },
      {
        id: 'high_activity',
        name: 'Высокая активность',
        description: 'Пользователь проявил высокую активность в системе',
        targetRole: 'editor',
        priority: 25,
        checkCondition: async (user: User) => {
          // Здесь можно добавить логику проверки активности пользователя
          // Например, количество созданных записей, время в системе и т.д.
          return false; // Пока не реализовано
        },
      },
      {
        id: 'payment_verified',
        name: 'Подтверждение платежа',
        description: 'Пользователь подтвердил платеж за премиум функции',
        targetRole: 'editor',
        priority: 35,
        checkCondition: async (user: User) => {
          // Здесь можно добавить логику проверки платежей
          return false; // Пока не реализовано
        },
      },
    ];
  }

  /**
   * Получение истории изменений ролей пользователя
   */
  async getUserRoleHistory(userId: string): Promise<any[]> {
    // ЗАГОТОВКА: Здесь можно добавить логику для отслеживания истории ролей
    // Пока возвращаем пустой массив
    return [];
  }

  /**
   * Получение доступных ролей для повышения
   */
  async getAvailableRolesForPromotion(userId: string): Promise<Role[]> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Получаем только глобальные роли (super_admin, admin, viewer), кроме тех, что уже есть у пользователя
    const userRoleNames = user.userRoleAssignments?.map(assignment => 
      assignment.role?.name
    ).filter(Boolean) || [];
    const availableRoles = await this.rolesRepo.find({
      where: {
        isGlobal: true,
        name: Not(userRoleNames),
      } as any,
    });

    // Фильтруем только нужные роли (super_admin, admin, viewer)
    return availableRoles.filter(role => 
      ['super_admin', 'admin', 'viewer'].includes(role.name)
    );
  }
}
