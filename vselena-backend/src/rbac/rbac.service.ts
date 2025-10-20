import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Role) private rolesRepo: Repository<Role>,
    @InjectRepository(Permission) private permissionsRepo: Repository<Permission>,
  ) {}

  /**
   * Проверка наличия конкретного права у пользователя
   */
  async userHasPermission(userId: string, permissionName: string): Promise<boolean> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) return false;

    return user.roles.some(role =>
      role.permissions.some(perm => perm.name === permissionName)
    );
  }

  /**
   * Проверка наличия роли у пользователя
   */
  async userHasRole(userId: string, roleName: string): Promise<boolean> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    return user?.roles.some(role => role.name === roleName) ?? false;
  }

  /**
   * Получение всех прав пользователя (уникальный список)
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) return [];

    const permissions = new Set<string>();
    user.roles.forEach(role => {
      role.permissions.forEach(perm => permissions.add(perm.name));
    });

    return Array.from(permissions);
  }

  /**
   * Назначение роли пользователю
   */
  async assignRoleToUser(
    userId: string,
    roleId: string,
    grantedBy: string,
    expiresAt?: Date,
  ): Promise<void> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['organization', 'team'],
    });
    
    const role = await this.rolesRepo.findOne({
      where: { id: roleId },
    });

    if (!user || !role) {
      throw new NotFoundException('User or Role not found');
    }

    // Проверка scope: роль должна быть в той же организации
    if (role.organizationId && role.organizationId !== user.organizationId) {
      throw new ForbiddenException('Role not in same organization');
    }

    // Проверка scope: роль команды только для членов команды
    if (role.teamId && role.teamId !== user.teamId) {
      throw new ForbiddenException('Role not in same team');
    }

    // Проверяем, не назначена ли уже эта роль пользователю
    const existingUserRole = await this.usersRepo
      .createQueryBuilder()
      .relation(User, 'roles')
      .of(userId)
      .loadMany();
    
    const isAlreadyAssigned = existingUserRole.some(userRole => userRole.id === roleId);
    if (isAlreadyAssigned) {
      // Роль уже назначена, ничего не делаем
      return;
    }

    // Назначение роли через промежуточную таблицу
    await this.usersRepo
      .createQueryBuilder()
      .relation(User, 'roles')
      .of(userId)
      .add(roleId);

    // TODO: Сохранить granted_by и expires_at в user_roles
  }

  /**
   * Удаление роли у пользователя
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await this.usersRepo
      .createQueryBuilder()
      .relation(User, 'roles')
      .of(userId)
      .remove(roleId);
  }

  /**
   * Замена всех ролей пользователя на новую роль
   */
  async replaceUserRole(
    userId: string,
    newRoleId: string,
    grantedBy: string,
  ): Promise<void> {
    // Сначала получаем пользователя с текущими ролями
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    console.log('🔍 Текущие роли пользователя:', user.roles?.map(r => r.name));

    // Удаляем все текущие роли через прямой SQL запрос
    await this.usersRepo.query(
      'DELETE FROM user_roles WHERE "userId" = $1',
      [userId]
    );

    console.log('🔍 Удалили все роли пользователя');

    // Назначаем новую роль через прямой SQL запрос
    await this.usersRepo.query(
      'INSERT INTO user_roles ("userId", "roleId") VALUES ($1, $2)',
      [userId, newRoleId]
    );

    console.log('🔍 Назначили новую роль:', newRoleId);
  }

  /**
   * Создание кастомной роли (не системной)
   */
  async createRole(
    name: string,
    description: string,
    organizationId?: string,
    teamId?: string,
    permissionIds: string[] = [],
  ): Promise<Role> {
    const role = this.rolesRepo.create({
      name,
      description,
      organizationId,
      teamId,
      isSystem: false,
    });

    await this.rolesRepo.save(role);

    // Назначение прав
    if (permissionIds.length > 0) {
      await this.rolesRepo
        .createQueryBuilder()
        .relation(Role, 'permissions')
        .of(role.id)
        .add(permissionIds);
    }

    return role;
  }

  /**
   * Обновление прав роли
   */
  async updateRolePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    const role = await this.rolesRepo.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new ForbiddenException('Cannot modify system role');
    }

    // Удаляем все текущие права
    const currentPermissionIds = role.permissions.map(p => p.id);
    if (currentPermissionIds.length > 0) {
      await this.rolesRepo
        .createQueryBuilder()
        .relation(Role, 'permissions')
        .of(roleId)
        .remove(currentPermissionIds);
    }

    // Добавляем новые
    if (permissionIds.length > 0) {
      await this.rolesRepo
        .createQueryBuilder()
        .relation(Role, 'permissions')
        .of(roleId)
        .add(permissionIds);
    }
  }

  /**
   * Удаление роли (только не системные)
   */
  async deleteRole(roleId: string): Promise<void> {
    const role = await this.rolesRepo.findOne({ where: { id: roleId } });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new ForbiddenException('Cannot delete system role');
    }

    await this.rolesRepo.delete(roleId);
  }

  /**
   * Получение всех ролей организации
   */
  async getOrganizationRoles(organizationId: string): Promise<Role[]> {
    return this.rolesRepo.find({
      where: [
        { organizationId },
        { isSystem: true },
      ],
      relations: ['permissions'],
    });
  }

  /**
   * Получение всех доступных прав
   */
  async getAllPermissions(): Promise<Permission[]> {
    return this.permissionsRepo.find({
      order: { resource: 'ASC', action: 'ASC' },
    });
  }

  /**
   * Поиск роли по имени в контексте организации/команды
   */
  async findRoleByName(
    roleName: string,
    organizationId?: string | null,
    teamId?: string | null,
  ): Promise<Role | null> {
    const whereConditions: any = { name: roleName };
    
    if (organizationId) {
      whereConditions.organizationId = organizationId;
    } else {
      whereConditions.organizationId = null;
    }
    
    if (teamId) {
      whereConditions.teamId = teamId;
    } else {
      whereConditions.teamId = null;
    }

    return this.rolesRepo.findOne({
      where: whereConditions,
    });
  }

  /**
   * Получение роли по умолчанию
   */
  async getDefaultRole(): Promise<Role | null> {
    return this.rolesRepo.findOne({
      where: { name: 'viewer' },
    });
  }
}
