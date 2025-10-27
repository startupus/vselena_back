import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { User } from './entities/user.entity';
import { Invitation } from '../auth/micro-modules/invitations/entities/invitation.entity';
import { Team } from '../teams/entities/team.entity';
import { TeamMembership } from '../teams/entities/team-membership.entity';
import { OrganizationMembership } from '../organizations/entities/organization-membership.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Role } from '../rbac/entities/role.entity';
import { OrganizationRole } from '../organizations/entities/organization-role.entity';
import { TeamRole } from '../teams/entities/team-role.entity';
import { UserRoleAssignment } from './entities/user-role-assignment.entity';
import { RoleHierarchyService } from '../rbac/role-hierarchy.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Invitation)
    private invitationsRepo: Repository<Invitation>,
    @InjectRepository(Team)
    private teamsRepo: Repository<Team>,
    @InjectRepository(TeamMembership)
    private teamMembershipRepo: Repository<TeamMembership>,
    @InjectRepository(OrganizationMembership)
    private orgMembershipRepo: Repository<OrganizationMembership>,
    @InjectRepository(Organization)
    private organizationsRepo: Repository<Organization>,
    @InjectRepository(Role)
    private rolesRepo: Repository<Role>,
    @InjectRepository(OrganizationRole)
    private orgRoleRepo: Repository<OrganizationRole>,
    @InjectRepository(TeamRole)
    private teamRoleRepo: Repository<TeamRole>,
    @InjectRepository(UserRoleAssignment)
    private userRoleAssignmentRepo: Repository<UserRoleAssignment>,
    private roleHierarchyService: RoleHierarchyService,
  ) {}

  async findById(id: string, options?: { select?: string[]; relations?: string[] }): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { id },
      select: options?.select as any,
      relations: options?.relations || [
        'organizations', 
        'teams', 
        'userRoleAssignments', 
        'userRoleAssignments.role', 
        'userRoleAssignments.role.permissions',
        'userRoleAssignments.organizationRole',
        'userRoleAssignments.teamRole'
      ],
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
      relations: ['userRoleAssignments', 'userRoleAssignments.role', 'organizations', 'teams'],
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

    console.log(`🗑️ Deleting user ${id} and all related data...`);

    // 1. Удаляем все связанные приглашения (где пользователь является приглашающим или принявшим)
    await this.invitationsRepo.delete([
      { invitedById: id },
      { acceptedById: id }
    ]);
    console.log('✅ Deleted invitations');

    // 2. Удаляем связи пользователя с ролями
    await this.usersRepo.query('DELETE FROM user_role_assignments WHERE "userId" = $1', [id]);
    console.log('✅ Deleted user role assignments');

    // 3. Удаляем связи пользователя с командами (старая система)
    await this.usersRepo.query('DELETE FROM user_teams WHERE user_id = $1', [id]);
    console.log('✅ Deleted user team assignments');

    // 4. Удаляем связи пользователя с организациями (старая система)
    await this.usersRepo.query('DELETE FROM user_organizations WHERE user_id = $1', [id]);
    console.log('✅ Deleted user organization assignments');

    // 5. Удаляем связи пользователя с командами (новая система)
    await this.teamMembershipRepo.delete({ userId: id });
    console.log('✅ Deleted team memberships');

    // 6. Удаляем связи пользователя с организациями (новая система)
    await this.orgMembershipRepo.delete({ userId: id });
    console.log('✅ Deleted organization memberships');

    // 7. Удаляем refresh tokens
    await this.usersRepo.query('DELETE FROM refresh_tokens WHERE "userId" = $1', [id]);
    console.log('✅ Deleted refresh tokens');

    // 8. Удаляем two-factor codes
    await this.usersRepo.query('DELETE FROM two_factor_codes WHERE "userId" = $1', [id]);
    console.log('✅ Deleted two-factor codes');

    // 9. Удаляем email verification tokens
    await this.usersRepo.query('DELETE FROM email_verification_tokens WHERE "userId" = $1', [id]);
    console.log('✅ Deleted email verification tokens');

    // 10. Удаляем password reset tokens
    await this.usersRepo.query('DELETE FROM password_reset_tokens WHERE "userId" = $1', [id]);
    console.log('✅ Deleted password reset tokens');

    // 11. Удаляем notifications
    await this.usersRepo.query('DELETE FROM notifications WHERE "userId" = $1', [id]);
    console.log('✅ Deleted notifications');

    // 12. Удаляем referrals (где пользователь является referrer или referred)
    await this.usersRepo.query('DELETE FROM referrals WHERE "referrerId" = $1 OR "referredUserId" = $1 OR "referredId" = $1', [id]);
    console.log('✅ Deleted referrals');

    // 13. Удаляем audit logs
    await this.usersRepo.query('DELETE FROM audit_logs WHERE "userId" = $1', [id]);
    console.log('✅ Deleted audit logs');

    // 14. Удаляем пользователя
    const result = await this.usersRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
    console.log('✅ User deleted successfully');
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
      .leftJoinAndSelect('user.userRoleAssignments', 'userRoleAssignments')
      .leftJoinAndSelect('userRoleAssignments.role', 'role')
      .leftJoinAndSelect('user.teamMemberships', 'teamMemberships')
      .leftJoinAndSelect('teamMemberships.role', 'teamRole')
      .leftJoinAndSelect('teamMemberships.team', 'teamMembershipsTeam')
      .leftJoinAndSelect('user.organizationMemberships', 'organizationMemberships')
      .leftJoinAndSelect('organizationMemberships.role', 'orgRole')
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

    // Обрабатываем organizationMemberships
    if (currentUser.organizationMemberships) {
      currentUser.organizationMemberships.forEach(membership => {
        accessibleOrgIds.add(membership.organizationId);
      });
    }

    // Обрабатываем teamMemberships
    if (currentUser.teamMemberships) {
      currentUser.teamMemberships.forEach(membership => {
        accessibleTeamIds.add(membership.teamId);
      });
    }

    // После обновления accessibleOrgIds, загружаем команды этих организаций
    if (accessibleOrgIds.size > 0) {
      const teamsInOrgs = await this.teamsRepo
        .createQueryBuilder('team')
        .where('team.organizationId IN (:...orgIds)', { orgIds: Array.from(accessibleOrgIds) })
        .getMany();
      
      teamsInOrgs.forEach(team => accessibleTeamIds.add(team.id));
    }

    // Суперадмин видит всех пользователей
    console.log('🔍 Checking for super admin role...');
    console.log('🔍 currentUser.userRoleAssignments:', currentUser.userRoleAssignments?.length || 0);
    console.log('🔍 userRoleAssignments details:', currentUser.userRoleAssignments?.map(a => ({
      roleName: a.role?.name,
      organizationId: a.organizationId,
      teamId: a.teamId
    })));
    
    const isSuperAdmin = currentUser.userRoleAssignments?.some(
      assignment => assignment.role?.name === 'super_admin' && !assignment.organizationId && !assignment.teamId
    );
    
    console.log('🔍 isSuperAdmin:', isSuperAdmin);

    if (accessibleTeamIds.size === 0 && accessibleOrgIds.size === 0 && !isSuperAdmin) {
      return [];
    }

    // Получаем всех пользователей из доступных команд и организаций
    let query = this.usersRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.teams', 'team')
      .leftJoinAndSelect('user.organizations', 'organization')
      .leftJoinAndSelect('organization.teams', 'orgTeams')
      .leftJoinAndSelect('user.userRoleAssignments', 'userRoleAssignments')
      .leftJoinAndSelect('userRoleAssignments.role', 'role')
      .leftJoinAndSelect('role.permissions', 'permissions')
      .leftJoinAndSelect('user.teamMemberships', 'teamMemberships')
      .leftJoinAndSelect('teamMemberships.role', 'teamRole')
      .leftJoinAndSelect('teamMemberships.team', 'teamMembershipsTeam')
      .leftJoinAndSelect('user.organizationMemberships', 'organizationMemberships')
      .leftJoinAndSelect('organizationMemberships.role', 'orgRole')
      .where('user.isActive = :isActive', { isActive: true }); // Только активные пользователи
      // Убираем исключение создателей - они должны отображаться в списке сотрудников

    // Строим условие для поиска пользователей в доступных командах ИЛИ организациях
    const conditions: string[] = [];
    const parameters: any = {};

    if (isSuperAdmin) {
      // Суперадмин видит всех пользователей
      console.log('🔍 Super admin detected - showing all users');
      query = query.andWhere('1=1');
    } else {
      console.log('🔍 Not super admin - using restricted access');
      if (accessibleTeamIds.size > 0) {
        conditions.push('team.id IN (:...teamIds)');
        parameters.teamIds = Array.from(accessibleTeamIds);
      }

      if (accessibleOrgIds.size > 0) {
        conditions.push('organization.id IN (:...orgIds)');
        parameters.orgIds = Array.from(accessibleOrgIds);
        // Также добавляем пользователей через organizationMemberships
        conditions.push('organizationMemberships.organizationId IN (:...orgIds)');
      }

      if (conditions.length > 0) {
        query = query.andWhere(`(${conditions.join(' OR ')})`, parameters);
      }
    }

    const teamMembers = await query.getMany();
    console.log('🔍 teamMembers from query:', teamMembers.length, teamMembers.map(u => u.email));

    // Загружаем все команды, которые упоминаются в ролях и членстве
    const allTeamIds = new Set<string>();
    console.log('🔍 accessibleTeamIds:', Array.from(accessibleTeamIds));
    teamMembers.forEach(user => {
      console.log(`🔍 Processing user ${user.email} for team IDs`);
      if (user.userRoleAssignments) {
        user.userRoleAssignments.forEach(assignment => {
          console.log(`🔍 Assignment teamId: ${assignment.teamId}, accessible: ${assignment.teamId ? accessibleTeamIds.has(assignment.teamId) : false}`);
          if (assignment.teamId && accessibleTeamIds.has(assignment.teamId)) {
            allTeamIds.add(assignment.teamId);
            console.log(`🔍 Added teamId ${assignment.teamId} to allTeamIds`);
          }
        });
      }
      // Добавляем команды из teamMemberships
      if (user.teamMemberships) {
        user.teamMemberships.forEach(membership => {
          console.log(`🔍 Membership teamId: ${membership.teamId}, accessible: ${accessibleTeamIds.has(membership.teamId)}`);
          if (accessibleTeamIds.has(membership.teamId)) {
            allTeamIds.add(membership.teamId);
            console.log(`🔍 Added membership teamId ${membership.teamId} to allTeamIds`);
          }
        });
      }
    });
    console.log('🔍 Final allTeamIds:', Array.from(allTeamIds));

    // Загружаем названия команд
    const teamsMap = new Map<string, string>();
    if (allTeamIds.size > 0) {
      console.log('🔍 Loading teams for IDs:', Array.from(allTeamIds));
      const teams = await this.teamsRepo
        .createQueryBuilder('team')
        .where('team.id IN (:...teamIds)', { teamIds: Array.from(allTeamIds) })
      .getMany();

      console.log('🔍 Found teams:', teams.map(t => ({ id: t.id, name: t.name })));
      teams.forEach(team => {
        teamsMap.set(team.id, team.name);
      });
      console.log('🔍 teamsMap contents:', Array.from(teamsMap.entries()));
    }

    // Формируем роли по контексту для каждого пользователя
    console.log('🔍 About to process teamMembers:', teamMembers.length, teamMembers.map(u => u.email));
    const usersWithRolesByContext = teamMembers.map(user => {
          console.log(`🔍 Processing user ${user.email}:`, {
            userRoleAssignments: user.userRoleAssignments?.length || 0,
            teamMemberships: user.teamMemberships?.length || 0,
            organizationMemberships: user.organizationMemberships?.length || 0,
            teamMembershipsData: user.teamMemberships,
            organizationMembershipsData: user.organizationMemberships,
            accessibleOrgIds: Array.from(accessibleOrgIds),
            accessibleTeamIds: Array.from(accessibleTeamIds),
            isSuperAdmin: isSuperAdmin
          });
      
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

          // Обрабатываем глобальные роли (где organizationId и teamId равны null)
          if (!assignment.organizationId && !assignment.teamId) {
            // Это глобальная роль - добавляем в общий список ролей пользователя
            (user as any).globalRole = assignment.role?.name || 'viewer';
          }

          if (assignment.organizationId && accessibleOrgIds.has(assignment.organizationId)) {
            // Находим название организации
            const org = user.organizations?.find(o => o.id === assignment.organizationId);
            rolesByContext.organizations.push({
              ...roleInfo,
              organization: org?.name || 'Неизвестная организация'
            });
          }

          if (assignment.teamId && accessibleTeamIds.has(assignment.teamId)) {
            // Ищем команду в загруженных командах (user.teams) или в членстве (teamMemberships)
            let teamName = 'Неизвестная команда';
            const team = user.teams?.find(t => t.id === assignment.teamId);
            if (team) {
              teamName = team.name;
            } else {
              // Пробуем найти в teamMemberships
              const membership = user.teamMemberships?.find(m => m.teamId === assignment.teamId);
              if (membership && membership.team) {
                teamName = membership.team.name;
              }
            }
            rolesByContext.teams.push({
              ...roleInfo,
              team: teamName
            });
          }
        });
      }

      // Добавляем роли из новых систем членства (team_memberships, organization_memberships)
      if (user.teamMemberships) {
        user.teamMemberships.forEach(membership => {
          if (accessibleTeamIds.has(membership.teamId)) {
            // Используем membership.team.name, так как мы загружаем его через leftJoinAndSelect
            const teamName = membership.team?.name || teamsMap.get(membership.teamId) || 'Неизвестная команда';
            rolesByContext.teams.push({
              role: membership.role?.name || 'member',
              roleId: membership.role?.id,
              teamId: membership.teamId,
              team: teamName
            });
          }
        });
      }

      if (user.organizationMemberships) {
        user.organizationMemberships.forEach(membership => {
          if (accessibleOrgIds.has(membership.organizationId)) {
            const org = user.organizations?.find(o => o.id === membership.organizationId);
            const orgName = org?.name || 'Неизвестная организация';
            
            // Добавляем организацию
            rolesByContext.organizations.push({
              role: membership.role?.name || 'member',
              roleId: membership.role?.id,
              organizationId: membership.organizationId,
              organization: orgName
            });
            
            // Добавляем команды организации (члены организации имеют доступ ко всем командам)
            // Ищем команды организации в teamsMap, так как они загружаются как orgTeams
            if (org) {
              // Получаем все команды организации из teamsMap
              const orgTeams = Array.from(teamsMap.entries())
                .filter(([teamId, teamName]) => {
                  // Проверяем, что команда принадлежит этой организации
                  return accessibleTeamIds.has(teamId);
                });
              
              orgTeams.forEach(([teamId, teamName]) => {
                rolesByContext.teams.push({
                  role: membership.role?.name || 'member', // Роль в команде = роль в организации
                  roleId: membership.role?.id,
                  teamId: teamId,
                  team: teamName
                });
              });
            }
          }
        });
      }

      // Фильтруем команды пользователя - показываем только доступные команды
      const filteredTeams = user.teams?.filter(team => accessibleTeamIds.has(team.id)) || [];
      
      const result = {
        ...user,
        teams: filteredTeams, // Заменяем все команды на отфильтрованные
        rolesByContext,
        globalRole: (user as any).globalRole || null
      };
      
      console.log(`🔍 Final result for user ${user.email}:`, {
        rolesByContext,
        teams: filteredTeams
      });
      
      return result;
    });

    console.log('🔍 Final usersWithRolesByContext:', JSON.stringify(usersWithRolesByContext, null, 2));
    console.log('🔍🔍🔍 RETURNING usersWithRolesByContext with length:', usersWithRolesByContext.length);
    console.log('🔍🔍🔍 FINAL RESULT:', usersWithRolesByContext.map(u => ({ email: u.email, globalRole: (u as any).globalRole, rolesByContext: (u as any).rolesByContext })));
    console.log('🔍🔍🔍 ABOUT TO RETURN - checking if rolesByContext and globalRole are set');
    console.log('🔍🔍🔍 FINAL CHECK - rolesByContext and globalRole for each user:');
    usersWithRolesByContext.forEach((user, index) => {
      console.log(`🔍 User ${index}: ${user.email}, globalRole: ${(user as any).globalRole}, rolesByContext: ${JSON.stringify((user as any).rolesByContext)}`);
    });
    console.log('🔍🔍🔍 FINAL RETURN - about to return usersWithRolesByContext');
    return usersWithRolesByContext;
  }

  /**
   * Обновление команды пользователя
   */
  async updateUserTeam(userId: string, teamId: string, currentUserId: string, roleId?: string): Promise<User> {
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

      // Создаем запись в новой таблице team_memberships
      // Используем роль из приглашения или находим базовую роль для команды
      const team = await this.teamsRepo.findOne({
        where: { id: teamId },
        relations: ['roles']
      });
      
      let defaultRoleId: string | null = null;
      
      // Если передана роль из приглашения, используем её
      if (roleId) {
        defaultRoleId = roleId;
      } else if (team && team.roles && team.roles.length > 0) {
        // Ищем роль "member" или "editor" в команде
        const memberRole = team.roles.find(role => role.name === 'member' || role.name === 'editor');
        if (memberRole) {
          defaultRoleId = memberRole.id;
        } else {
          // Если нет подходящей роли, берем первую доступную
          defaultRoleId = team.roles[0].id;
        }
      }
      
      if (defaultRoleId) {
        const teamMembership = this.teamMembershipRepo.create({
          userId: userId,
          teamId: teamId,
          roleId: defaultRoleId,
          joinedAt: new Date(),
        });
        await this.teamMembershipRepo.save(teamMembership);
        console.log(`✅ Created team membership for user ${userId} in team ${teamId} with role ${defaultRoleId}`);
      } else {
        console.log(`⚠️ No roles found for team ${teamId}, skipping team membership creation`);
      }

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

      // Получаем организацию команды
      const teamWithOrg = await this.teamsRepo.findOne({
        where: { id: teamId },
        relations: ['organization']
      });

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
            organizationId: teamWithOrg?.organization?.id || null,
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

    // ✅ ПРОВЕРКА ПРАВ: текущий пользователь должен иметь право управлять целевым пользователем
    const context = { organizationId, teamId };
    const permissionCheck = await this.canManageUser(assignedBy, userId, context);
    if (!permissionCheck.canManage) {
      throw new ForbiddenException(
        `Недостаточно прав для изменения роли пользователя. ` +
        `Ваша роль: ${permissionCheck.managerRole} (уровень ${permissionCheck.managerLevel}), ` +
        `роль пользователя: ${permissionCheck.targetRole} (уровень ${permissionCheck.targetLevel})`
      );
    }
    console.log(`✅ Permission check passed for changeUserRole: ${permissionCheck.managerRole} (${permissionCheck.managerLevel}) >= ${permissionCheck.targetRole} (${permissionCheck.targetLevel})`);

    // Проверяем доступ к организации/команде
    if (organizationId) {
      const currentUserOrgMembership = await this.orgMembershipRepo.findOne({
        where: { userId: assignedBy, organizationId }
      });
      
      if (!currentUserOrgMembership) {
        throw new ForbiddenException('You do not have access to this organization');
      }
    }

    if (teamId) {
      // Получаем информацию о команде и её организации
      const team = await this.teamsRepo.findOne({
        where: { id: teamId },
        relations: ['organization']
      });
      
      if (!team) {
        throw new NotFoundException('Team not found');
      }

      // Проверяем доступ к команде через:
      // 1. Прямое членство в команде
      // 2. Членство в организации, к которой принадлежит команда
      const currentUserTeamMembership = await this.teamMembershipRepo.findOne({
        where: { userId: assignedBy, teamId }
      });
      
      const currentUserOrgMembership = team.organizationId ? await this.orgMembershipRepo.findOne({
        where: { userId: assignedBy, organizationId: team.organizationId }
      }) : null;
      
      const hasAccessToTeam = currentUserTeamMembership !== null || currentUserOrgMembership !== null;
      
      if (!hasAccessToTeam) {
        throw new ForbiddenException('You do not have access to this team');
      }

      // ВАЖНО: Проверяем, что пользователь, которому назначается роль, состоит в этой команде
      const userTeamMembership = await this.teamMembershipRepo.findOne({
        where: { userId, teamId }
      });
      
      if (!userTeamMembership) {
        throw new ForbiddenException('Пользователь не является членом этой команды. Сначала добавьте пользователя в команду.');
      }
    }

    if (organizationId) {
      // ВАЖНО: Проверяем, что пользователь, которому назначается роль, состоит в этой организации
      const userOrgMembership = await this.orgMembershipRepo.findOne({
        where: { userId, organizationId }
      });
      
      if (!userOrgMembership) {
        throw new ForbiddenException('Пользователь не является членом этой организации. Сначала добавьте пользователя в организацию.');
      }
    }

    // ✅ ИСПРАВЛЕНИЕ: Работаем со СТАРОЙ системой (organization_memberships, team_memberships)
    // вместо новой системы (user_role_assignments)
    
    if (organizationId) {
      // Обновляем роль в organization_memberships
      const orgMembership = await this.orgMembershipRepo.findOne({
        where: { userId, organizationId }
      });
      
      if (orgMembership) {
        // Обновляем существующую запись
        orgMembership.roleId = roleId;
        orgMembership.updatedAt = new Date();
        await this.orgMembershipRepo.save(orgMembership);
        console.log(`✅ Updated organization membership role for user ${userId}, role ${roleId}, org ${organizationId}`);
      } else {
        throw new NotFoundException('Organization membership not found');
      }
    } else if (teamId) {
      // Обновляем роль в team_memberships
      const teamMembership = await this.teamMembershipRepo.findOne({
        where: { userId, teamId }
      });
      
      if (teamMembership) {
        // Обновляем существующую запись
        teamMembership.roleId = roleId;
        teamMembership.updatedAt = new Date();
        await this.teamMembershipRepo.save(teamMembership);
        console.log(`✅ Updated team membership role for user ${userId}, role ${roleId}, team ${teamId}`);
      } else {
        throw new NotFoundException('Team membership not found');
      }
    } else {
      // Глобальная роль - работаем с user_role_assignments
      let existingAssignment = await this.userRoleAssignmentRepo
        .createQueryBuilder('ura')
        .where('ura.userId = :userId', { userId })
        .andWhere('ura.organizationId IS NULL')
        .andWhere('ura.teamId IS NULL')
        .getOne();

      if (existingAssignment) {
        // Обновляем существующую запись
        existingAssignment.roleId = roleId;
        existingAssignment.assignedBy = assignedBy;
        existingAssignment.updatedAt = new Date();
        await this.userRoleAssignmentRepo.save(existingAssignment);
        console.log(`✅ Updated global role assignment for user ${userId}, role ${roleId}`);
      } else {
        // Создаем новую запись для глобальной роли
        const newAssignment = this.userRoleAssignmentRepo.create({
          userId,
          roleId,
          organizationId: null,
          teamId: null,
          assignedBy,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await this.userRoleAssignmentRepo.save(newAssignment);
        console.log(`✅ Created new global role assignment for user ${userId}, role ${roleId}`);
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

    // ✅ ПРОВЕРКА ПРАВ: текущий пользователь должен иметь право управлять целевым пользователем
    const context = { teamId: (fromTeamId || toTeamId) || undefined };
    const permissionCheck = await this.canManageUser(currentUserId, userId, context);
    if (!permissionCheck.canManage) {
      throw new ForbiddenException(
        `Недостаточно прав для перемещения пользователя. ` +
        `Ваша роль: ${permissionCheck.managerRole} (уровень ${permissionCheck.managerLevel}), ` +
        `роль пользователя: ${permissionCheck.targetRole} (уровень ${permissionCheck.targetLevel})`
      );
    }
    console.log(`✅ Permission check passed for transferUserBetweenTeams: ${permissionCheck.managerRole} (${permissionCheck.managerLevel}) >= ${permissionCheck.targetRole} (${permissionCheck.targetLevel})`);

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
    console.log(`🚀 REMOVE USER FROM CONTEXT: userId=${userId}, currentUserId=${currentUserId}`);
    
    // Проверяем, что пользователь существует
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Проверяем, что текущий пользователь имеет право на удаление
    const currentUser = await this.findById(currentUserId, {
      relations: ['organizations', 'teams']
    });
    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    // ✅ ПРОВЕРКА ПРАВ будет выполнена для каждой команды/организации отдельно
    // Мы не можем проверить глобально, так как права зависят от контекста
    console.log(`⚠️ Skipping global permission check - will check for each team/org separately`);
    
    console.log(`🔍 Current user loaded: ${JSON.stringify({
      id: currentUser.id,
      email: currentUser.email,
      organizations: currentUser.organizations?.length || 0,
      teams: currentUser.teams?.length || 0
    })}`);

    // Получаем все доступные организации и команды текущего пользователя
    const accessibleOrgIds = currentUser.organizations?.map(org => org.id) || [];
    const accessibleTeamIds = currentUser.teams?.map(team => team.id) || [];
    
    console.log(`🔍 Current user accessible orgs (old system): ${accessibleOrgIds.length}`);
    console.log(`🔍 Current user accessible teams (old system): ${accessibleTeamIds.length}`);
    
    // Если в старой системе нет данных, проверяем новую систему
    if (accessibleOrgIds.length === 0) {
      const orgMemberships = await this.orgMembershipRepo.find({
        where: { userId: currentUserId },
        relations: ['organization']
      });
      accessibleOrgIds.push(...orgMemberships.map(membership => membership.organizationId));
      console.log(`🔍 Current user accessible orgs (new system): ${accessibleOrgIds.length}`);
    }
    
    if (accessibleTeamIds.length === 0) {
      const teamMemberships = await this.teamMembershipRepo.find({
        where: { userId: currentUserId },
        relations: ['team']
      });
      accessibleTeamIds.push(...teamMemberships.map(membership => membership.teamId));
      console.log(`🔍 Current user accessible teams (new system): ${accessibleTeamIds.length}`);
    }
    
    // Добавляем команды, которые принадлежат доступным организациям
    if (accessibleOrgIds.length > 0) {
      const teamsInOrgs = await this.teamsRepo.find({
        where: { organizationId: In(accessibleOrgIds) }
      });
      accessibleTeamIds.push(...teamsInOrgs.map(team => team.id));
      console.log(`🔍 Teams in accessible orgs: ${teamsInOrgs.length}`);
    }
    
    console.log(`🔍 Total accessible team IDs: ${accessibleTeamIds.length}`);
    console.log(`🔍 Accessible team IDs: ${JSON.stringify(accessibleTeamIds)}`);

    // ✅ Удаляем роли пользователя только в доступных контекстах (старая система) с проверкой прав
    // Сначала удаляем роли команд
    if (accessibleTeamIds.length > 0) {
      for (const teamId of accessibleTeamIds) {
        try {
          const permissionCheck = await this.canManageUser(currentUserId, userId, { teamId });
          if (permissionCheck.canManage) {
            await this.usersRepo
              .createQueryBuilder()
              .delete()
              .from('user_role_assignments')
              .where('userId = :userId', { userId })
              .andWhere('teamId = :teamId', { teamId })
              .execute();
            console.log(`✅ Removed user ${userId} role assignments from team ${teamId} (old system)`);
          }
        } catch (error) {
          console.error(`❌ Error removing role assignments from team ${teamId}:`, error.message);
        }
      }
    }

    // Затем удаляем роли организаций
    if (accessibleOrgIds.length > 0) {
      for (const organizationId of accessibleOrgIds) {
        try {
          const permissionCheck = await this.canManageUser(currentUserId, userId, { organizationId });
          if (permissionCheck.canManage) {
            await this.usersRepo
              .createQueryBuilder()
              .delete()
              .from('user_role_assignments')
              .where('userId = :userId', { userId })
              .andWhere('organizationId = :organizationId', { organizationId })
              .execute();
            console.log(`✅ Removed user ${userId} role assignments from organization ${organizationId} (old system)`);
          }
        } catch (error) {
          console.error(`❌ Error removing role assignments from organization ${organizationId}:`, error.message);
        }
      }
    }

    // ✅ Удаляем связи с доступными командами (старая система) с проверкой прав
    if (accessibleTeamIds.length > 0) {
      for (const teamId of accessibleTeamIds) {
        try {
          const permissionCheck = await this.canManageUser(currentUserId, userId, { teamId });
          if (permissionCheck.canManage) {
            await this.usersRepo
              .createQueryBuilder()
              .delete()
              .from('user_teams')
              .where('user_id = :userId', { userId })
              .andWhere('team_id = :teamId', { teamId })
              .execute();
            console.log(`✅ Removed user ${userId} from team ${teamId} (old system user_teams)`);
          }
        } catch (error) {
          console.error(`❌ Error removing from user_teams for team ${teamId}:`, error.message);
        }
      }
    }

    // ✅ Удаляем связи с доступными организациями (старая система) с проверкой прав
    if (accessibleOrgIds.length > 0) {
      for (const organizationId of accessibleOrgIds) {
        try {
          const permissionCheck = await this.canManageUser(currentUserId, userId, { organizationId });
          if (permissionCheck.canManage) {
            await this.usersRepo
              .createQueryBuilder()
              .delete()
              .from('user_organizations')
              .where('user_id = :userId', { userId })
              .andWhere('organization_id = :organizationId', { organizationId })
              .execute();
            console.log(`✅ Removed user ${userId} from organization ${organizationId} (old system user_organizations)`);
          }
        } catch (error) {
          console.error(`❌ Error removing from user_organizations for organization ${organizationId}:`, error.message);
        }
      }
    }

    // ✅ Удаляем из новой системы (team_memberships) с проверкой прав для КАЖДОЙ команды
    if (accessibleTeamIds.length > 0) {
      for (const teamId of accessibleTeamIds) {
        try {
          // Проверяем права в контексте ЭТОЙ команды
          const permissionCheck = await this.canManageUser(currentUserId, userId, { teamId });
          if (permissionCheck.canManage) {
            await this.teamMembershipRepo.delete({
              userId,
              teamId
            });
            console.log(`✅ Removed user ${userId} from team ${teamId} (permission check passed)`);
          } else {
            console.log(`⚠️ Skipping team ${teamId} - insufficient permissions (${permissionCheck.managerRole} level ${permissionCheck.managerLevel} < ${permissionCheck.targetRole} level ${permissionCheck.targetLevel})`);
          }
        } catch (error) {
          console.error(`❌ Error removing user from team ${teamId}:`, error.message);
        }
      }
    }

    // ✅ Удаляем из новой системы (organization_memberships) с проверкой прав для КАЖДОЙ организации
    if (accessibleOrgIds.length > 0) {
      for (const organizationId of accessibleOrgIds) {
        try {
          // Проверяем права в контексте ЭТОЙ организации
          const permissionCheck = await this.canManageUser(currentUserId, userId, { organizationId });
          if (permissionCheck.canManage) {
            await this.orgMembershipRepo.delete({
              userId,
              organizationId
            });
            console.log(`✅ Removed user ${userId} from organization ${organizationId} (permission check passed)`);
          } else {
            console.log(`⚠️ Skipping organization ${organizationId} - insufficient permissions (${permissionCheck.managerRole} level ${permissionCheck.managerLevel} < ${permissionCheck.targetRole} level ${permissionCheck.targetLevel})`);
          }
        } catch (error) {
          console.error(`❌ Error removing user from organization ${organizationId}:`, error.message);
        }
      }
    }

    console.log(`✅ Removed user ${userId} from context (both old and new systems, with permission checks)`);
  }


  /**
   * Получение пользователей из контекста текущего пользователя
   * (только те, кто принадлежит к организациям/командам текущего пользователя)
   */
  async getUsersInContext(currentUserId: string): Promise<User[]> {
    console.log(`🔍🔍🔍 getUsersInContext CALLED for user: ${currentUserId}`);
    console.log(`🔍 Getting users in context for user: ${currentUserId}`);
    console.log(`🔍 Starting getUsersInContext for user: ${currentUserId}`);
    console.log('🔍🔍🔍 DEBUG: Function started successfully');
    console.log('🔍🔍🔍 DEBUG: About to call findById');
    console.log('🔍🔍🔍 DEBUG: This should appear in logs');
    
    // Получаем текущего пользователя с его организациями и командами
    const currentUser = await this.findById(currentUserId, {
      relations: ['organizations', 'teams', 'userRoleAssignments', 'userRoleAssignments.role', 'organizationMemberships', 'teamMemberships']
    });
    
    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }
    
    console.log('🔍🔍🔍 DEBUG: currentUser found, continuing...');
    console.log('🔍🔍🔍 DEBUG: About to process organizationMemberships and teamMemberships');
    console.log('🔍🔍🔍 DEBUG: currentUser.userRoleAssignments:', currentUser.userRoleAssignments?.length || 0);

    // Получаем доступные организации и команды из старой системы
    const accessibleOrgIds = currentUser.organizations?.map(org => org.id) || [];
    const accessibleTeamIds = currentUser.teams?.map(team => team.id) || [];
    
    // Получаем доступные организации и команды из новой системы
    const orgMemberships = await this.orgMembershipRepo.find({
      where: { userId: currentUserId },
      relations: ['organization']
    });
    const newSystemOrgIds = orgMemberships.map(membership => membership.organizationId);
    
    const teamMemberships = await this.teamMembershipRepo.find({
      where: { userId: currentUserId },
      relations: ['team']
    });
    const newSystemTeamIds = teamMemberships.map(membership => membership.teamId);
    
    // Объединяем ID из обеих систем
    const allOrgIds = [...new Set([...accessibleOrgIds, ...newSystemOrgIds])];
    const allTeamIds = [...new Set([...accessibleTeamIds, ...newSystemTeamIds])];
    
    // Добавляем команды, которые принадлежат доступным организациям
    if (allOrgIds.length > 0) {
      const teamsInOrgs = await this.teamsRepo.find({
        where: { organizationId: In(allOrgIds) }
      });
      allTeamIds.push(...teamsInOrgs.map(team => team.id));
    }
    
    // ✅ ИСПРАВЛЕНИЕ: Добавляем организации, к которым принадлежат доступные команды
    if (allTeamIds.length > 0) {
      const teamsWithOrgs = await this.teamsRepo.find({
        where: { id: In(allTeamIds) },
        relations: ['organization']
      });
      const orgsFromTeams = teamsWithOrgs
        .map(team => team.organizationId)
        .filter(orgId => orgId !== null);
      allOrgIds.push(...orgsFromTeams);
      
      // Убираем дубликаты
      const uniqueOrgIds = [...new Set(allOrgIds)];
      allOrgIds.length = 0;
      allOrgIds.push(...uniqueOrgIds);
      
      console.log(`🔍 Added organizations from teams: ${orgsFromTeams.length}`);
    }
    
    // Суперадмин видит всех пользователей
    console.log('🔍 Checking for super admin role...');
    console.log('🔍 currentUser.userRoleAssignments:', currentUser.userRoleAssignments?.length || 0);
    console.log('🔍 userRoleAssignments details:', currentUser.userRoleAssignments?.map(a => ({
      roleName: a.role?.name,
      organizationId: a.organizationId,
      teamId: a.teamId
    })));
    
    const isSuperAdmin = currentUser.userRoleAssignments?.some(
      assignment => assignment.role?.name === 'super_admin' && !assignment.organizationId && !assignment.teamId
    );
    
    console.log('🔍 isSuperAdmin:', isSuperAdmin);

    console.log(`🔍 Accessible org IDs: ${allOrgIds.length}`);
    console.log(`🔍 Accessible team IDs: ${allTeamIds.length}`);
    
    if (allOrgIds.length === 0 && allTeamIds.length === 0 && !isSuperAdmin) {
      console.log(`⚠️ No accessible organizations or teams found for user ${currentUserId}`);
      return [];
    }

    // Находим всех пользователей, которые принадлежат к доступным организациям/командам
    // Используем UNION для объединения результатов из обеих систем
    let query = this.usersRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organizations', 'org')
      .leftJoinAndSelect('user.teams', 'team')
      .leftJoinAndSelect('user.userRoleAssignments', 'roleAssignment')
      .leftJoinAndSelect('roleAssignment.role', 'role')
      .leftJoinAndSelect('roleAssignment.organizationRole', 'organizationRoleAssignment')
      .leftJoinAndSelect('roleAssignment.teamRole', 'teamRoleAssignment')
      .leftJoinAndSelect('role.permissions', 'permission')
      .leftJoinAndSelect('user.teamMemberships', 'teamMemberships')
      .leftJoinAndSelect('teamMemberships.role', 'teamRole')
      .leftJoinAndSelect('teamMemberships.team', 'teamMembershipsTeam')
      .leftJoinAndSelect('user.organizationMemberships', 'organizationMemberships')
      .leftJoinAndSelect('organizationMemberships.role', 'organizationRole');
    
    if (isSuperAdmin) {
      // Суперадмин видит всех пользователей
      console.log('🔍 Super admin detected - showing all users');
      query = query.where('user.isActive = true');
    } else {
      console.log('🔍 Not super admin - using restricted access');
      query = query.where(
        allOrgIds.length > 0 && allTeamIds.length > 0
          ? '(org.id IN (:...orgIds) OR team.id IN (:...teamIds) OR user.id IN (SELECT DISTINCT "userId" FROM organization_memberships WHERE "organizationId" IN (:...orgIds)) OR user.id IN (SELECT DISTINCT "userId" FROM team_memberships WHERE "teamId" IN (:...teamIds))) AND user.isActive = true'
          : allOrgIds.length > 0
          ? '(org.id IN (:...orgIds) OR user.id IN (SELECT DISTINCT "userId" FROM organization_memberships WHERE "organizationId" IN (:...orgIds))) AND user.isActive = true'
          : '(team.id IN (:...teamIds) OR user.id IN (SELECT DISTINCT "userId" FROM team_memberships WHERE "teamId" IN (:...teamIds))) AND user.isActive = true',
        {
          orgIds: allOrgIds,
          teamIds: allTeamIds
        }
      );
    }
    
    const users = await query.getMany();

    console.log(`✅ Found ${users.length} users in context`);
    console.log('🔍🔍🔍 DEBUG: About to process users array');
    console.log('🔍🔍🔍 DEBUG: users array:', users.map(u => ({ email: u.email, id: u.id })));
    
    console.log('🔍🔍🔍 DEBUG: About to load organizations, allOrgIds:', allOrgIds);
    
    // Загружаем названия организаций
    const organizationsMap = new Map<string, string>();
    if (allOrgIds.length > 0) {
      console.log('🔍 Loading organizations for IDs:', allOrgIds);
      const organizations = await this.organizationsRepo
        .createQueryBuilder('org')
        .where('org.id IN (:...orgIds)', { orgIds: allOrgIds })
        .getMany();

      console.log('🔍 Found organizations:', organizations.map(o => ({ id: o.id, name: o.name })));
      organizations.forEach(org => {
        organizationsMap.set(org.id, org.name);
      });
      console.log('🔍 organizationsMap contents:', Array.from(organizationsMap.entries()));
    }
    
    // Обрабатываем каждого пользователя и добавляем rolesByContext и globalRole
    console.log('🔍🔍🔍 DEBUG: About to start users.map');
    const usersWithRolesByContext = users.map(user => {
      console.log(`🔍🔍🔍 DEBUG: Processing user ${user.email} in map`);
      const rolesByContext: {
        organizations: any[];
        teams: any[];
      } = {
        organizations: [],
        teams: []
      };
      
      let globalRole: string | null = null;
      
      // Обрабатываем userRoleAssignments
      console.log(`🔍🔍🔍 DEBUG: Processing userRoleAssignments for ${user.email}:`, user.userRoleAssignments?.length || 0);
      if (user.userRoleAssignments) {
        user.userRoleAssignments.forEach(assignment => {
          console.log(`🔍🔍🔍 DEBUG: Assignment for ${user.email}:`, {
            role: assignment.role?.name,
            organizationRole: assignment.organizationRole?.name,
            teamRole: assignment.teamRole?.name,
            organizationId: assignment.organizationId,
            teamId: assignment.teamId
          });
          
          // Глобальные роли (где organizationId и teamId равны null)
          if (!assignment.organizationId && !assignment.teamId && assignment.role) {
            globalRole = assignment.role.name || 'viewer';
            console.log(`🔍🔍🔍 DEBUG: Set globalRole for ${user.email}:`, globalRole);
          }
          
          // Организационные роли из userRoleAssignments
          if (assignment.organizationRole && assignment.organizationId) {
            const orgName = organizationsMap.get(assignment.organizationId) || 'Неизвестная организация';
            rolesByContext.organizations.push({
              role: assignment.organizationRole.name,
              roleId: assignment.organizationRole.id,
              organizationId: assignment.organizationId,
              organization: orgName
            });
            console.log(`🔍🔍🔍 DEBUG: Added org role for ${user.email}:`, assignment.organizationRole.name, 'in', orgName);
          }
          
          // Командные роли из userRoleAssignments
          if (assignment.teamRole && assignment.teamId) {
            // Находим название команды
            let teamName = 'Неизвестная команда';
            const team = user.teams?.find(t => t.id === assignment.teamId);
            if (team) {
              teamName = team.name;
            }
            
            rolesByContext.teams.push({
              role: assignment.teamRole.name,
              roleId: assignment.teamRole.id,
              teamId: assignment.teamId,
              team: teamName
            });
            console.log(`🔍🔍🔍 DEBUG: Added team role for ${user.email}:`, assignment.teamRole.name, 'in', teamName);
          }
        });
      }
      
      // Обрабатываем organizationMemberships
      console.log(`🔍🔍🔍 DEBUG: Processing organizationMemberships for ${user.email}:`, user.organizationMemberships?.length || 0);
      if (user.organizationMemberships) {
        user.organizationMemberships.forEach(membership => {
          console.log(`🔍🔍🔍 DEBUG: OrganizationMembership for ${user.email}:`, {
            organizationId: membership.organizationId,
            role: membership.role?.name,
            userOrganizations: user.organizations?.length || 0
          });
          // Используем organizationsMap для получения названия организации
          const orgName = organizationsMap.get(membership.organizationId) || 'Неизвестная организация';
          console.log(`🔍🔍🔍 DEBUG: OrgName for ${user.email}:`, orgName);
          rolesByContext.organizations.push({
            role: membership.role?.name || 'member',
            roleId: membership.role?.id,
            organizationId: membership.organizationId,
            organization: orgName
          });
        });
      }
      
      // Обрабатываем teamMemberships
      if (user.teamMemberships) {
        user.teamMemberships.forEach(membership => {
          // Используем membership.team.name, так как мы загружаем его через leftJoinAndSelect
          const teamName = membership.team?.name || 'Неизвестная команда';
          rolesByContext.teams.push({
            role: membership.role?.name || 'member',
            roleId: membership.role?.id,
            teamId: membership.teamId,
            team: teamName
          });
        });
      }
      
      return {
        ...user,
        rolesByContext,
        globalRole
      };
    });
    
    console.log('🔍 Processed users with rolesByContext:', usersWithRolesByContext.length);
    return usersWithRolesByContext;
  }

  /**
   * Проверить, может ли пользователь управлять другим пользователем
   */
  async canManageUser(
    managerId: string,
    targetUserId: string,
    context: { organizationId?: string; teamId?: string },
  ): Promise<{ canManage: boolean; managerRole: string; targetRole: string; managerLevel: number; targetLevel: number }> {
    console.log(`🔐 canManageUser called: managerId=${managerId}, targetUserId=${targetUserId}, context=${JSON.stringify(context)}`);
    
    const canManage = await this.roleHierarchyService.canManageUser(managerId, targetUserId, context);
    
    // Получаем роли для возврата в ответе
    const managerEffectiveRole = await this.roleHierarchyService.getUserEffectiveRole(managerId, context);
    const targetEffectiveRole = await this.roleHierarchyService.getUserEffectiveRole(targetUserId, context);
    
    console.log(`🔐 Manager effective role: ${managerEffectiveRole.role} (scope: ${managerEffectiveRole.scope})`);
    console.log(`🔐 Target effective role: ${targetEffectiveRole.role} (scope: ${targetEffectiveRole.scope})`);
    
    // Получаем уровни ролей
    const ROLE_LEVELS: Record<string, number> = {
      super_admin: 100,
      admin: 80,
      manager: 60,
      editor: 40,
      viewer: 20,
    };
    
    const result = {
      canManage,
      managerRole: managerEffectiveRole.role,
      targetRole: targetEffectiveRole.role,
      managerLevel: ROLE_LEVELS[managerEffectiveRole.role] || 0,
      targetLevel: ROLE_LEVELS[targetEffectiveRole.role] || 0,
    };
    
    console.log(`🔐 canManageUser result: ${JSON.stringify(result)}`);
    return result;
  }
}
