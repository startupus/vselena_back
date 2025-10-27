import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { TeamRole } from './entities/team-role.entity';
import { TeamMembership } from './entities/team-membership.entity';
import { User } from '../users/entities/user.entity';
import { OrganizationMembership } from '../organizations/entities/organization-membership.entity';
import { Role } from '../rbac/entities/role.entity';
import { RoleHierarchyService } from '../rbac/role-hierarchy.service';

export interface CreateTeamDto {
  name: string;
  description?: string;
  organizationId: string;
}

export interface UpdateTeamDto {
  name?: string;
  description?: string;
}

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamRepo: Repository<Team>,
    @InjectRepository(TeamRole)
    private teamRoleRepo: Repository<TeamRole>,
    @InjectRepository(TeamMembership)
    private teamMembershipRepo: Repository<TeamMembership>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(OrganizationMembership)
    private orgMembershipRepo: Repository<OrganizationMembership>,
    @InjectRepository(Role)
    private rolesRepo: Repository<Role>,
    private roleHierarchyService: RoleHierarchyService,
  ) {}

  /**
   * Создать команду
   */
  async createTeam(
    dto: CreateTeamDto,
    creatorId: string,
  ): Promise<Team> {
    // Проверяем права на создание команды в организации
    const canCreate = await this.roleHierarchyService.canCreateTeams(creatorId, dto.organizationId);
    if (!canCreate) {
      throw new ForbiddenException('Недостаточно прав для создания команды в этой организации');
    }

    // Создаем команду
    const team = this.teamRepo.create({
      ...dto,
      createdBy: creatorId,
    });

    const savedTeam = await this.teamRepo.save(team);
    console.log(`✅ Team created: ${savedTeam.name} (ID: ${savedTeam.id})`);

    // Создаем системные роли для команды
    console.log(`🔧 About to create system roles for team: ${savedTeam.id}`);
    await this.createSystemRoles(savedTeam.id);
    console.log(`✅ System roles creation completed for team: ${savedTeam.id}`);

    // Команда создается пустой - участники добавляются через приглашения
    console.log(`✅ Team created empty: ${savedTeam.name} (ID: ${savedTeam.id})`);

    return savedTeam;
  }

  /**
   * Создать системные роли для команды
   */
  private async createSystemRoles(teamId: string): Promise<void> {
    console.log(`🔧 Creating system roles for team: ${teamId}`);
    
    const systemRoles = [
      {
        name: 'super_admin',
        description: 'Суперадминистратор команды',
        permissions: ['teams.manage', 'users.invite', 'users.manage', 'users.remove', 'roles.manage'],
        level: 100,
      },
      {
        name: 'admin',
        description: 'Администратор команды',
        permissions: ['teams.manage', 'users.invite', 'users.manage', 'users.remove'],
        level: 80,
      },
      {
        name: 'manager',
        description: 'Менеджер команды',
        permissions: ['teams.manage', 'users.invite', 'users.manage'],
        level: 60,
      },
      {
        name: 'editor',
        description: 'Редактор команды',
        permissions: ['teams.read', 'content.create', 'content.edit'],
        level: 40,
      },
      {
        name: 'viewer',
        description: 'Наблюдатель команды',
        permissions: ['teams.read'],
        level: 20,
      },
    ];

    for (const roleData of systemRoles) {
      console.log(`🔧 Creating role: ${roleData.name} for team: ${teamId}`);
      const role = this.teamRoleRepo.create({
        ...roleData,
        teamId,
        isSystem: true,
      });
      const savedRole = await this.teamRoleRepo.save(role);
      console.log(`✅ Role created: ${savedRole.name} (ID: ${savedRole.id})`);
    }
    
    console.log(`✅ System roles created for team: ${teamId}`);
  }

  /**
   * Добавить участника в команду
   */
  async addMemberToTeam(
    teamId: string,
    userId: string,
    roleName: string,
    invitedBy: string,
  ): Promise<TeamMembership> {
    // Получаем команду для проверки организации
    const team = await this.teamRepo.findOne({
      where: { id: teamId },
      relations: ['organization'],
    });

    if (!team) {
      throw new NotFoundException('Команда не найдена');
    }

    // Проверяем права на приглашение
    const canInvite = await this.roleHierarchyService.canInviteUsers(invitedBy, { 
      organizationId: team.organizationId || undefined,
      teamId,
    });
    if (!canInvite) {
      throw new ForbiddenException('Недостаточно прав для приглашения в команду');
    }

    // Находим роль
    const role = await this.teamRoleRepo.findOne({
      where: { name: roleName, teamId },
    });

    if (!role) {
      throw new NotFoundException(`Роль ${roleName} не найдена в команде`);
    }

    // Проверяем, не является ли пользователь уже участником
    const existingMembership = await this.teamMembershipRepo.findOne({
      where: { userId, teamId },
    });

    if (existingMembership) {
      throw new ForbiddenException('Пользователь уже является участником команды');
    }

    // Создаем членство в новой системе (team_memberships)
    const membership = this.teamMembershipRepo.create({
      userId,
      teamId,
      roleId: role.id,
      invitedBy,
    });

    const savedMembership = await this.teamMembershipRepo.save(membership);

    // Добавляем в старую систему (user_teams)
    await this.teamRepo
      .createQueryBuilder()
      .insert()
      .into('user_teams')
      .values({
        user_id: userId,
        team_id: teamId,
      })
      .execute();

    console.log(`✅ Added user ${userId} to team ${teamId} in both systems`);
    
    return savedMembership;
  }

  /**
   * Изменить роль участника команды
   */
  async changeMemberRole(
    teamId: string,
    userId: string,
    newRoleName: string,
    changedBy: string,
  ): Promise<TeamMembership | null> {
    // Получаем команду для проверки организации
    const team = await this.teamRepo.findOne({
      where: { id: teamId },
      relations: ['organization'],
    });

    if (!team) {
      throw new NotFoundException('Команда не найдена');
    }

    // Проверяем права на изменение роли
    const canManage = await this.roleHierarchyService.canManageUser(changedBy, userId, { 
      organizationId: team.organizationId || undefined,
      teamId,
    });
    if (!canManage) {
      throw new ForbiddenException('Недостаточно прав для изменения роли');
    }

    // Находим новую роль
    const newRole = await this.teamRoleRepo.findOne({
      where: { name: newRoleName, teamId },
    });

    if (!newRole) {
      throw new NotFoundException(`Роль ${newRoleName} не найдена в команде`);
    }

    // Обновляем роль
    await this.teamMembershipRepo.update(
      { userId, teamId },
      { roleId: newRole.id },
    );

    const membership = await this.teamMembershipRepo.findOne({
      where: { userId, teamId },
      relations: ['role', 'user'],
    });
    return membership || null;
  }

  /**
   * Удалить участника из команды
   */
  async removeMemberFromTeam(
    teamId: string,
    userId: string,
    removedBy: string,
  ): Promise<void> {
    // Получаем команду для проверки организации
    const team = await this.teamRepo.findOne({
      where: { id: teamId },
      relations: ['organization'],
    });

    if (!team) {
      throw new NotFoundException('Команда не найдена');
    }

    // Проверяем права на удаление
    const canManage = await this.roleHierarchyService.canManageUser(removedBy, userId, { 
      organizationId: team.organizationId || undefined,
      teamId,
    });
    if (!canManage) {
      throw new ForbiddenException('Недостаточно прав для удаления участника');
    }

    // Удаляем из новой системы (team_memberships)
    await this.teamMembershipRepo.delete({ userId, teamId });
    
    // Удаляем из старой системы (user_teams)
    await this.teamRepo
      .createQueryBuilder()
      .delete()
      .from('user_teams')
      .where('user_id = :userId', { userId })
      .andWhere('team_id = :teamId', { teamId })
      .execute();
    
    console.log(`✅ Removed user ${userId} from team ${teamId} from both systems`);
  }

  /**
   * Получить участников команды
   * Показывает только явных участников команды + членов организации (если они не были явно удалены из команды)
   */
  async getTeamMembers(teamId: string): Promise<{ team: any; members: any[] }> {
    // Загружаем команду с организацией и создателем
    const team = await this.teamRepo.findOne({
      where: { id: teamId },
      relations: ['organization', 'creator'],
    });

    if (!team) {
      return { team: null, members: [] };
    }

    // 1. Получаем явных участников команды
    const teamMemberships = await this.teamMembershipRepo.find({
      where: { teamId },
      relations: ['user', 'role', 'inviter'],
    });

    // 2. Получаем всех членов организации
    const orgMemberships = team.organizationId ? await this.orgMembershipRepo.find({
      where: { organizationId: team.organizationId },
      relations: ['user', 'role'],
    }) : [];

    // 3. ✅ ИСПРАВЛЕНИЕ: Показываем только явных членов команды
    // Члены организации НЕ добавляются автоматически, если они не являются явными членами команды
    const membersMap = new Map();

    // Добавляем только явных членов команды
    teamMemberships.forEach(membership => {
      membersMap.set(membership.user.id, {
        id: membership.user.id,
        email: membership.user.email,
        firstName: membership.user.firstName,
        lastName: membership.user.lastName,
        role: membership.role,
        joinedAt: membership.createdAt,
        inviter: membership.inviter,
        source: 'team'
      });
    });

    return {
      team: team,
      members: Array.from(membersMap.values())
    };
  }

  /**
   * Получить команды пользователя
   */
  async getUserTeams(userId: string): Promise<Team[]> {
    const memberships = await this.teamMembershipRepo.find({
      where: { userId },
      relations: ['team', 'role'],
    });

    return memberships.map(membership => membership.team);
  }

  /**
   * Получить все доступные команды пользователя
   * Включает команды, где пользователь является участником или создателем организации
   */
  async getAccessibleTeams(userId: string): Promise<Team[]> {
    try {
      // 1. Получаем команды, где пользователь является участником
      const userMemberships = await this.teamMembershipRepo.find({
        where: { userId },
        relations: ['team', 'team.organization', 'role'],
      });

      const userTeams = userMemberships.map(membership => membership.team);

      // 2. Получаем команды организаций, где пользователь является создателем или участником
      // Используем более простой подход через OrganizationMembership
      const orgMemberships = await this.teamRepo
        .createQueryBuilder('team')
        .leftJoin('team.organization', 'organization')
        .leftJoin('organization.memberships', 'orgMembership')
        .where('orgMembership.userId = :userId', { userId })
        .getMany();

      // Объединяем команды и убираем дубликаты
      const allTeams = [...userTeams, ...orgMemberships];
      const uniqueTeams = allTeams.filter((team, index, self) => 
        index === self.findIndex(t => t.id === team.id)
      );

      return uniqueTeams;
    } catch (error) {
      console.error('Error in getAccessibleTeams:', error);
      // В случае ошибки возвращаем только команды пользователя
      return this.getUserTeams(userId);
    }
  }

  /**
   * Получить команду по ID
   */
  async getTeamById(id: string): Promise<Team> {
    const team = await this.teamRepo.findOne({
      where: { id },
      relations: ['organization', 'memberships', 'memberships.user', 'memberships.role'],
    });

    if (!team) {
      throw new NotFoundException('Команда не найдена');
    }

    return team;
  }

  /**
   * Обновить команду
   */
  async updateTeam(
    id: string,
    dto: UpdateTeamDto,
    updatedBy: string,
  ): Promise<Team> {
    const team = await this.getTeamById(id);

    // Проверяем права на редактирование
    const userRole = await this.roleHierarchyService.getUserEffectiveRole(updatedBy, { 
      organizationId: team.organizationId || undefined,
      teamId: id,
    });
    if (!['super_admin', 'admin', 'manager'].includes(userRole.role)) {
      throw new ForbiddenException('Недостаточно прав для редактирования команды');
    }

    await this.teamRepo.update(id, dto);
    return this.getTeamById(id);
  }

  /**
   * Удалить команду
   */
  async deleteTeam(id: string, deletedBy: string): Promise<void> {
    const team = await this.getTeamById(id);

    // Проверяем права на удаление
    const userRole = await this.roleHierarchyService.getUserEffectiveRole(deletedBy, { 
      organizationId: team.organizationId || undefined,
      teamId: id,
    });
    if (!['super_admin', 'admin', 'manager'].includes(userRole.role)) {
      throw new ForbiddenException('Недостаточно прав для удаления команды');
    }

    // Удаляем все связанные записи перед удалением команды
    // 1. Удаляем членство пользователей в команде (новая система)
    await this.teamMembershipRepo.delete({ teamId: id });

    // 2. Удаляем роли команды
    await this.teamRoleRepo.delete({ teamId: id });

    // 3. Удаляем записи из старой системы ManyToMany (user_teams)
    await this.teamRepo.query('DELETE FROM user_teams WHERE team_id = $1', [id]);

    // 4. Удаляем саму команду
    await this.teamRepo.delete(id);
  }

  /**
   * Получить команды организации
   */
  async getOrganizationTeams(organizationId: string): Promise<Team[]> {
    return this.teamRepo.find({
      where: { organizationId },
      relations: ['memberships', 'memberships.user', 'memberships.role'],
    });
  }

  /**
   * Получить роли команды
   */
  async getTeamRolesFromRolesTable(teamId: string, userId: string): Promise<any[]> {
    // Возвращаем роли из таблицы team_roles для команды
    const allRoles = await this.teamRoleRepo.find({
      where: { teamId },
      order: { level: 'DESC' },
    });

    // Фильтруем роли по уровню пользователя
    return this.roleHierarchyService.getAvailableRolesForInvite(
      userId,
      { teamId },
      allRoles,
    ) as Promise<any[]>;
  }

  async getTeamRoles(teamId: string, userId?: string): Promise<TeamRole[]> {
    const allRoles = await this.teamRoleRepo.find({
      where: { teamId },
      order: { level: 'DESC' }, // Сортируем по уровню (от высшего к низшему)
    });

    // Если userId не указан, возвращаем все роли
    if (!userId) {
      return allRoles;
    }

    // Если userId указан, фильтруем роли по уровню пользователя
    return this.roleHierarchyService.getAvailableRolesForInvite(
      userId,
      { teamId },
      allRoles,
    ) as Promise<TeamRole[]>;
  }
}