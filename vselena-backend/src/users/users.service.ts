import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Invitation } from '../auth/micro-modules/invitations/entities/invitation.entity';
import { Team } from '../teams/entities/team.entity';
import { Role } from '../rbac/entities/role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Invitation)
    private invitationsRepo: Repository<Invitation>,
    @InjectRepository(Team)
    private teamsRepo: Repository<Team>,
    @InjectRepository(Role)
    private rolesRepo: Repository<Role>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { id },
      relations: ['organizations', 'teams', 'userRoleAssignments', 'userRoleAssignments.role', 'userRoleAssignments.role.permissions'],
    });
  }

  async findByEmail(email: string, options?: { select?: string[]; relations?: string[] }): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { email },
      select: options?.select as any,
      relations: options?.relations as any,
    });
  }

  async findByPhone(phone: string, options?: { select?: string[]; relations?: string[] }): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { phone },
      select: options?.select as any,
      relations: options?.relations as any,
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepo.create(userData);
    return this.usersRepo.save(user);
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.usersRepo.findAndCount({
      relations: ['roles', 'organization', 'team'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { users, total };
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, userData);
    return this.usersRepo.save(user);
  }

  async delete(id: string): Promise<void> {
    // Проверяем, существует ли пользователь
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Удаляем все связанные приглашения (где пользователь является приглашающим или принявшим)
    await this.invitationsRepo.delete([
      { invitedById: id },
      { acceptedById: id }
    ]);

    // Удаляем связи пользователя с ролями
    await this.usersRepo.query('DELETE FROM user_roles WHERE "userId" = $1', [id]);

    // Удаляем связи пользователя с командами
    await this.usersRepo.query('DELETE FROM user_teams WHERE "user_id" = $1', [id]);

    // Удаляем связи пользователя с организациями
    await this.usersRepo.query('DELETE FROM user_organizations WHERE "user_id" = $1', [id]);

    // Удаляем пользователя
    const result = await this.usersRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // TODO: Implement role assignment logic
    // This will be implemented in RBAC service
  }

  /**
   * Получение количества пользователей в системе
   */
  async getUserCount(): Promise<number> {
    return this.usersRepo.count();
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.teams || [];
  }

  /**
   * Получение сотрудников команд пользователя
   */
  async getTeamMembers(userId: string): Promise<User[]> {
    // Получаем текущего пользователя с его командами и организациями
    const currentUser = await this.usersRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.teams', 'teams')
      .leftJoinAndSelect('user.organizations', 'organizations')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!currentUser) {
      return [];
    }

    // Собираем все ID команд и организаций, к которым имеет доступ текущий пользователь
    const accessibleTeamIds = new Set<string>();
    const accessibleOrgIds = new Set<string>();

    // Организации, в которых пользователь является членом
    if (currentUser.organizations) {
      currentUser.organizations.forEach(org => accessibleOrgIds.add(org.id));
    }

    // Если пользователь является членом организации, получаем все команды этой организации
    if (accessibleOrgIds.size > 0) {
      const teamsInOrgs = await this.teamsRepo
        .createQueryBuilder('team')
        .where('team.organizationId IN (:...orgIds)', { orgIds: Array.from(accessibleOrgIds) })
        .getMany();
      
      teamsInOrgs.forEach(team => accessibleTeamIds.add(team.id));
    }

    // Также добавляем команды, в которых пользователь является членом
    if (currentUser.teams) {
      currentUser.teams.forEach(team => accessibleTeamIds.add(team.id));
    }

    if (accessibleTeamIds.size === 0 && accessibleOrgIds.size === 0) {
      return [];
    }

    // Получаем всех пользователей из доступных команд и организаций
    let query = this.usersRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.teams', 'team')
      .leftJoinAndSelect('user.organizations', 'organization')
      .leftJoinAndSelect('user.userRoleAssignments', 'userRoleAssignments')
      .leftJoinAndSelect('userRoleAssignments.role', 'role')
      .leftJoinAndSelect('role.permissions', 'permissions')
      .where('user.id != :userId', { userId }); // Исключаем самого пользователя

    // Строим условие для поиска пользователей в доступных командах ИЛИ организациях
    const conditions: string[] = [];
    const parameters: any = {};

    if (accessibleTeamIds.size > 0) {
      conditions.push('team.id IN (:...teamIds)');
      parameters.teamIds = Array.from(accessibleTeamIds);
    }

    if (accessibleOrgIds.size > 0) {
      conditions.push('organization.id IN (:...orgIds)');
      parameters.orgIds = Array.from(accessibleOrgIds);
    }

    if (conditions.length > 0) {
      query = query.andWhere(`(${conditions.join(' OR ')})`, parameters);
    }

    const teamMembers = await query.getMany();

    // Загружаем все команды, которые упоминаются в ролях
    const allTeamIds = new Set<string>();
    teamMembers.forEach(user => {
      if (user.userRoleAssignments) {
        user.userRoleAssignments.forEach(assignment => {
          if (assignment.teamId && accessibleTeamIds.has(assignment.teamId)) {
            allTeamIds.add(assignment.teamId);
          }
        });
      }
    });

    // Загружаем названия команд
    const teamsMap = new Map<string, string>();
    if (allTeamIds.size > 0) {
      const teams = await this.teamsRepo
        .createQueryBuilder('team')
        .where('team.id IN (:...teamIds)', { teamIds: Array.from(allTeamIds) })
        .getMany();
      
      teams.forEach(team => {
        teamsMap.set(team.id, team.name);
      });
    }

    // Формируем роли по контексту для каждого пользователя
    const usersWithRolesByContext = teamMembers.map(user => {
      const rolesByContext: {
        organizations: any[];
        teams: any[];
      } = {
        organizations: [],
        teams: []
      };

      // Группируем роли по организациям и командам
      // Показываем только те роли, которые относятся к организациям/командам, к которым имеет доступ текущий пользователь
      if (user.userRoleAssignments) {
        user.userRoleAssignments.forEach(assignment => {
          const roleInfo = {
            role: assignment.role?.name || 'viewer',
            roleId: assignment.role?.id,
            organizationId: assignment.organizationId,
            teamId: assignment.teamId
          };

          if (assignment.organizationId && accessibleOrgIds.has(assignment.organizationId)) {
            // Находим название организации
            const org = user.organizations?.find(o => o.id === assignment.organizationId);
            rolesByContext.organizations.push({
              ...roleInfo,
              organization: org?.name || 'Неизвестная организация'
            });
          }

          if (assignment.teamId && accessibleTeamIds.has(assignment.teamId)) {
            // Находим название команды из загруженных команд или из карты команд
            const team = user.teams?.find(t => t.id === assignment.teamId);
            const teamName = team?.name || teamsMap.get(assignment.teamId) || 'Неизвестная команда';
            rolesByContext.teams.push({
              ...roleInfo,
              team: teamName
            });
          }
        });
      }

      // Фильтруем команды пользователя - показываем только доступные команды
      const filteredTeams = user.teams?.filter(team => accessibleTeamIds.has(team.id)) || [];
      
      return {
        ...user,
        teams: filteredTeams, // Заменяем все команды на отфильтрованные
        rolesByContext
      };
    });

    return usersWithRolesByContext;
  }

  /**
   * Обновление команды пользователя
   */
  async updateUserTeam(userId: string, teamId: string, currentUserId: string): Promise<User> {
    // Проверяем, что пользователь существует
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Проверяем, что текущий пользователь имеет право изменять команду
    // (например, он должен быть в той же команде или быть админом)
    const currentUser = await this.findById(currentUserId);
    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    // Сначала получаем ID старой команды пользователя
    const oldTeamAssignment = await this.usersRepo
      .createQueryBuilder()
      .select('team_id')
      .from('user_teams', 'ut')
      .where('ut.user_id = :userId', { userId })
      .getRawOne();

    // Обновляем связь в таблице user_teams
    // Сначала удаляем старые связи
    await this.usersRepo
      .createQueryBuilder()
      .delete()
      .from('user_teams')
      .where('user_id = :userId', { userId })
      .execute();

    // Добавляем новую связь
    if (teamId) {
      await this.usersRepo
        .createQueryBuilder()
        .insert()
        .into('user_teams')
        .values({
          user_id: userId,
          team_id: teamId
        })
        .execute();

      // Обновляем роли пользователя - удаляем старые роли команды и добавляем базовую роль для новой команды
      // Удаляем роли только для старой команды
      if (oldTeamAssignment?.team_id) {
        await this.usersRepo
          .createQueryBuilder()
          .delete()
          .from('user_role_assignments')
          .where('userId = :userId', { userId })
          .andWhere('teamId = :oldTeamId', { oldTeamId: oldTeamAssignment.team_id })
          .execute();
      }

      // Добавляем базовую роль viewer для новой команды
      const viewerRole = await this.usersRepo
        .createQueryBuilder()
        .select('role.id')
        .from('roles', 'role')
        .where('role.name = :name', { name: 'viewer' })
        .andWhere('role.isSystem = :isSystem', { isSystem: true })
        .getRawOne();

      if (viewerRole) {
        await this.usersRepo
          .createQueryBuilder()
          .insert()
          .into('user_role_assignments')
          .values({
            userId,
            roleId: viewerRole.id,
            organizationId: null,
            teamId,
            assignedBy: currentUserId,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .execute();
      }
    }

    // Возвращаем обновленного пользователя
    const updatedUser = await this.findById(userId);
    if (!updatedUser) {
      throw new NotFoundException('Updated user not found');
    }
    return updatedUser;
  }

  /**
   * Обновление организации пользователя
   */
  async updateUserOrganization(userId: string, organizationId: string, currentUserId: string): Promise<User> {
    // Проверяем, что пользователь существует
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Проверяем, что текущий пользователь имеет право изменять организацию
    const currentUser = await this.findById(currentUserId);
    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    // Сначала получаем ID старой организации пользователя
    const oldOrgAssignment = await this.usersRepo
      .createQueryBuilder()
      .select('organization_id')
      .from('user_organizations', 'uo')
      .where('uo.user_id = :userId', { userId })
      .getRawOne();

    // Обновляем связь в таблице user_organizations
    // Сначала удаляем старые связи
    await this.usersRepo
      .createQueryBuilder()
      .delete()
      .from('user_organizations')
      .where('user_id = :userId', { userId })
      .execute();

    // Добавляем новую связь
    if (organizationId) {
      await this.usersRepo
        .createQueryBuilder()
        .insert()
        .into('user_organizations')
        .values({
          user_id: userId,
          organization_id: organizationId
        })
        .execute();

      // Обновляем роли пользователя - удаляем старые роли организации и добавляем базовую роль для новой организации
      // Удаляем роли только для старой организации
      if (oldOrgAssignment?.organization_id) {
        await this.usersRepo
          .createQueryBuilder()
          .delete()
          .from('user_role_assignments')
          .where('userId = :userId', { userId })
          .andWhere('organizationId = :oldOrgId', { oldOrgId: oldOrgAssignment.organization_id })
          .andWhere('teamId IS NULL')
          .execute();
      }

      // Добавляем базовую роль viewer для новой организации
      const viewerRole = await this.usersRepo
        .createQueryBuilder()
        .select('role.id')
        .from('roles', 'role')
        .where('role.name = :name', { name: 'viewer' })
        .andWhere('role.isSystem = :isSystem', { isSystem: true })
        .getRawOne();

      if (viewerRole) {
        await this.usersRepo
          .createQueryBuilder()
          .insert()
          .into('user_role_assignments')
          .values({
            userId,
            roleId: viewerRole.id,
            organizationId,
            teamId: null,
            assignedBy: currentUserId,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .execute();
      }
    }

    // Возвращаем обновленного пользователя
    const updatedUser = await this.findById(userId);
    if (!updatedUser) {
      throw new NotFoundException('Updated user not found');
    }
    return updatedUser;
  }

  /**
   * Изменение роли пользователя
   */
  async changeUserRole(
    userId: string,
    roleId: string,
    assignedBy: string,
    organizationId?: string,
    teamId?: string
  ): Promise<User> {
    // Проверяем, существует ли пользователь
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Проверяем, что текущий пользователь имеет право изменять роли
    const currentUser = await this.findById(assignedBy);
    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    // Проверяем доступ к организации/команде
    if (organizationId) {
      const hasAccessToOrg = currentUser.organizations?.some(org => org.id === organizationId);
      if (!hasAccessToOrg) {
        throw new ForbiddenException('You do not have access to this organization');
      }
    }

    if (teamId) {
      // Проверяем, что текущий пользователь имеет доступ к команде
      const hasAccessToTeam = currentUser.teams?.some(team => team.id === teamId) ||
        currentUser.organizations?.some(org => {
          // Проверяем, что команда принадлежит к организации, к которой имеет доступ пользователь
          return user.teams?.some(team => team.id === teamId && team.organizationId === org.id);
        });
      
      if (!hasAccessToTeam) {
        throw new ForbiddenException('You do not have access to this team');
      }

      // ВАЖНО: Проверяем, что пользователь, которому назначается роль, состоит в этой команде
      const userIsInTeam = user.teams?.some(team => team.id === teamId);
      if (!userIsInTeam) {
        throw new ForbiddenException('Пользователь не является членом этой команды. Сначала добавьте пользователя в команду.');
      }
    }

    if (organizationId) {
      // ВАЖНО: Проверяем, что пользователь, которому назначается роль, состоит в этой организации
      const userIsInOrg = user.organizations?.some(org => org.id === organizationId);
      if (!userIsInOrg) {
        throw new ForbiddenException('Пользователь не является членом этой организации. Сначала добавьте пользователя в организацию.');
      }
    }

    // Удаляем ВСЕ старые роли пользователя в данном контексте
    // Если указан контекст (organizationId или teamId), удаляем роли только в этом контексте
    // Если контекст не указан, удаляем все роли пользователя
    let deleteQuery = this.usersRepo
      .createQueryBuilder()
      .delete()
      .from('user_role_assignments')
      .where('userId = :userId', { userId });

    if (organizationId && teamId) {
      // Удаляем роли в конкретной команде конкретной организации
      deleteQuery = deleteQuery
        .andWhere('organizationId = :organizationId', { organizationId })
        .andWhere('teamId = :teamId', { teamId });
    } else if (organizationId) {
      // Удаляем роли в организации (но не в командах)
      deleteQuery = deleteQuery
        .andWhere('organizationId = :organizationId', { organizationId })
        .andWhere('teamId IS NULL');
    } else if (teamId) {
      // Удаляем роли в команде (но не в организации)
      deleteQuery = deleteQuery
        .andWhere('teamId = :teamId', { teamId })
        .andWhere('organizationId IS NULL');
    }
    // Если ни organizationId, ни teamId не указаны, удаляем все роли

    const deleteResult = await deleteQuery.execute();
    console.log(`Deleted ${deleteResult.affected} old role assignments for user ${userId}`);

    // Добавляем новую роль
    const insertResult = await this.usersRepo
      .createQueryBuilder()
      .insert()
      .into('user_role_assignments')
      .values({
        userId,
        roleId,
        organizationId: organizationId || null,
        teamId: teamId || null,
        assignedBy,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .execute();
    
    console.log(`Added new role assignment for user ${userId}, role ${roleId}, org ${organizationId}, team ${teamId}`);

    // Возвращаем обновленного пользователя
    const updatedUser = await this.findById(userId);
    if (!updatedUser) {
      throw new NotFoundException('Updated user not found');
    }
    return updatedUser;
  }

  /**
   * Перенос пользователя между командами
   */
  async transferUserBetweenTeams(
    userId: string,
    fromTeamId: string | null,
    toTeamId: string | null,
    currentUserId: string,
    roleId: string
  ): Promise<User> {
    // Проверяем, что пользователь существует
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Проверяем, что текущий пользователь имеет право на перевод
    const currentUser = await this.findById(currentUserId);
    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    // Получаем информацию о командах для проверки доступа
    let fromTeam: Team | null = null;
    let toTeam: Team | null = null;

    if (fromTeamId) {
      fromTeam = await this.teamsRepo.findOne({
        where: { id: fromTeamId },
        relations: ['organization']
      });
    }

    if (toTeamId) {
      toTeam = await this.teamsRepo.findOne({
        where: { id: toTeamId },
        relations: ['organization']
      });
    }

    // Проверяем, что текущий пользователь имеет доступ к исходной команде
    if (fromTeamId && fromTeam) {
      const hasAccessToFromTeam = currentUser.organizations?.some(org => 
        org.id === fromTeam!.organizationId
      ) || currentUser.teams?.some(team => team.id === fromTeamId);
      
      if (!hasAccessToFromTeam) {
        throw new ForbiddenException('You do not have access to the source team');
      }

      // ВАЖНО: Проверяем, что пользователь, которого переводят, состоит в исходной команде
      const userIsInFromTeam = user.teams?.some(team => team.id === fromTeamId);
      if (!userIsInFromTeam) {
        throw new ForbiddenException('User is not a member of the source team');
      }
    }

    // Проверяем, что текущий пользователь имеет доступ к целевой команде
    if (toTeamId && toTeam) {
      const hasAccessToToTeam = currentUser.organizations?.some(org => 
        org.id === toTeam!.organizationId
      ) || currentUser.teams?.some(team => team.id === toTeamId);
      
      if (!hasAccessToToTeam) {
        throw new ForbiddenException('You do not have access to the target team');
      }
    }

    // Удаляем старые роли пользователя в исходной команде
    if (fromTeamId) {
      await this.usersRepo
        .createQueryBuilder()
        .delete()
        .from('user_role_assignments')
        .where('userId = :userId', { userId })
        .andWhere('teamId = :fromTeamId', { fromTeamId })
        .execute();
    }

    // Удаляем старую связь с командой
    if (fromTeamId) {
      await this.usersRepo
        .createQueryBuilder()
        .delete()
        .from('user_teams')
        .where('user_id = :userId', { userId })
        .andWhere('team_id = :fromTeamId', { fromTeamId })
        .execute();
    }

    // Добавляем новую связь с командой
    if (toTeamId) {
      await this.usersRepo
        .createQueryBuilder()
        .insert()
        .into('user_teams')
        .values({
          user_id: userId,
          team_id: toTeamId
        })
        .execute();
    }

    // Назначаем новую роль в целевой команде
    if (roleId && toTeamId && toTeam) {
      // Получаем organizationId целевой команды
      const targetTeamOrgId = toTeam.organizationId || null;
      
      await this.usersRepo
        .createQueryBuilder()
        .insert()
        .into('user_role_assignments')
        .values({
          userId,
          roleId,
          organizationId: targetTeamOrgId,
          teamId: toTeamId,
          assignedBy: currentUserId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .execute();
    } else if (toTeamId && toTeam) {
      // Если роль не указана, назначаем роль по умолчанию (viewer)
      const targetTeamOrgId = toTeam.organizationId || null;
      const viewerRole = await this.rolesRepo.findOne({
        where: { name: 'viewer' }
      });
      
      if (viewerRole) {
        await this.usersRepo
          .createQueryBuilder()
          .insert()
          .into('user_role_assignments')
          .values({
            userId,
            roleId: viewerRole.id,
            organizationId: targetTeamOrgId,
            teamId: toTeamId,
            assignedBy: currentUserId,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .execute();
      }
    }

    // Возвращаем обновленного пользователя
    const updatedUser = await this.findById(userId);
    if (!updatedUser) {
      throw new NotFoundException('Updated user not found');
    }
    return updatedUser;
  }

  /**
   * Удаление пользователя из всех доступных контекстов (НЕ полное удаление пользователя)
   */
  async removeUserFromContext(
    userId: string,
    currentUserId: string
  ): Promise<void> {
    // Проверяем, что пользователь существует
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Проверяем, что текущий пользователь имеет право на удаление
    const currentUser = await this.findById(currentUserId);
    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    // Получаем все доступные организации и команды текущего пользователя
    const accessibleOrgIds = currentUser.organizations?.map(org => org.id) || [];
    const accessibleTeamIds = currentUser.teams?.map(team => team.id) || [];
    
    // Добавляем команды, которые принадлежат доступным организациям
    if (accessibleOrgIds.length > 0) {
      const teamsInOrgs = await this.teamsRepo.find({
        where: { organizationId: In(accessibleOrgIds) }
      });
      accessibleTeamIds.push(...teamsInOrgs.map(team => team.id));
    }

    // Удаляем роли пользователя только в доступных контекстах
    if (accessibleOrgIds.length > 0 || accessibleTeamIds.length > 0) {
      let deleteQuery = this.usersRepo
        .createQueryBuilder()
        .delete()
        .from('user_role_assignments')
        .where('userId = :userId', { userId });

      const conditions: string[] = [];
      if (accessibleOrgIds.length > 0) {
        conditions.push('organizationId IN (:...accessibleOrgIds)');
      }
      if (accessibleTeamIds.length > 0) {
        conditions.push('teamId IN (:...accessibleTeamIds)');
      }

      if (conditions.length > 0) {
        deleteQuery = deleteQuery.andWhere(`(${conditions.join(' OR ')})`, {
          accessibleOrgIds,
          accessibleTeamIds
        });
      }

      await deleteQuery.execute();
    }

    // Удаляем связи с доступными командами
    if (accessibleTeamIds.length > 0) {
      await this.usersRepo
        .createQueryBuilder()
        .delete()
        .from('user_teams')
        .where('user_id = :userId', { userId })
        .andWhere('team_id IN (:...accessibleTeamIds)', { accessibleTeamIds })
        .execute();
    }

    // Удаляем связи с доступными организациями
    if (accessibleOrgIds.length > 0) {
      await this.usersRepo
        .createQueryBuilder()
        .delete()
        .from('user_organizations')
        .where('user_id = :userId', { userId })
        .andWhere('organization_id IN (:...accessibleOrgIds)', { accessibleOrgIds })
        .execute();
    }
  }
}
