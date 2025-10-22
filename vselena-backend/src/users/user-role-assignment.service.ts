import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRoleAssignment } from './entities/user-role-assignment.entity';
import { User } from './entities/user.entity';
import { Role } from '../rbac/entities/role.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Team } from '../teams/entities/team.entity';

@Injectable()
export class UserRoleAssignmentService {
  constructor(
    @InjectRepository(UserRoleAssignment)
    private userRoleAssignmentRepo: Repository<UserRoleAssignment>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Role)
    private rolesRepo: Repository<Role>,
    @InjectRepository(Organization)
    private organizationsRepo: Repository<Organization>,
    @InjectRepository(Team)
    private teamsRepo: Repository<Team>,
  ) {}

  /**
   * Назначить роль пользователю в контексте команды/организации
   */
  async assignRole(
    userId: string,
    roleId: string,
    organizationId: string | null,
    teamId: string | null,
    assignedBy: string,
    expiresAt?: Date,
  ): Promise<UserRoleAssignment> {
    // Проверяем, что пользователь существует
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Проверяем, что роль существует
    const role = await this.rolesRepo.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Роль не найдена');
    }

    // Проверяем, что организация существует (если указана)
    if (organizationId) {
      const organization = await this.organizationsRepo.findOne({ where: { id: organizationId } });
      if (!organization) {
        throw new NotFoundException('Организация не найдена');
      }
    }

    // Проверяем, что команда существует (если указана)
    if (teamId) {
      const team = await this.teamsRepo.findOne({ where: { id: teamId } });
      if (!team) {
        throw new NotFoundException('Команда не найдена');
      }
    }

    // Проверяем, что пользователь состоит в указанной организации/команде
    const userOrganizations = await this.usersRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organizations', 'organizations')
      .leftJoinAndSelect('user.teams', 'teams')
      .where('user.id = :userId', { userId })
      .getOne();

    if (organizationId && !userOrganizations.organizations?.some(org => org.id === organizationId)) {
      throw new ForbiddenException('Пользователь не состоит в указанной организации');
    }

    if (teamId && !userOrganizations.teams?.some(team => team.id === teamId)) {
      throw new ForbiddenException('Пользователь не состоит в указанной команде');
    }

    // Удаляем существующее назначение роли в том же контексте
    await this.userRoleAssignmentRepo.delete({
      userId,
      roleId,
      organizationId,
      teamId,
    });

    // Создаем новое назначение роли
    const assignment = this.userRoleAssignmentRepo.create({
      userId,
      roleId,
      organizationId,
      teamId,
      assignedBy,
      expiresAt,
    });

    return this.userRoleAssignmentRepo.save(assignment);
  }

  /**
   * Удалить роль у пользователя в контексте команды/организации
   */
  async removeRole(
    userId: string,
    roleId: string,
    organizationId: string | null,
    teamId: string | null,
  ): Promise<void> {
    const result = await this.userRoleAssignmentRepo.delete({
      userId,
      roleId,
      organizationId,
      teamId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Назначение роли не найдено');
    }
  }

  /**
   * Получить все роли пользователя в контексте команды/организации
   */
  async getUserRoles(
    userId: string,
    organizationId?: string,
    teamId?: string,
  ): Promise<UserRoleAssignment[]> {
    const query = this.userRoleAssignmentRepo
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.role', 'role')
      .leftJoinAndSelect('assignment.organization', 'organization')
      .leftJoinAndSelect('assignment.team', 'team')
      .where('assignment.userId = :userId', { userId });

    if (organizationId) {
      query.andWhere('assignment.organizationId = :organizationId', { organizationId });
    }

    if (teamId) {
      query.andWhere('assignment.teamId = :teamId', { teamId });
    }

    return query.getMany();
  }

  /**
   * Проверить, есть ли у пользователя определенная роль в контексте
   */
  async userHasRole(
    userId: string,
    roleName: string,
    organizationId?: string,
    teamId?: string,
  ): Promise<boolean> {
    const query = this.userRoleAssignmentRepo
      .createQueryBuilder('assignment')
      .leftJoin('assignment.role', 'role')
      .where('assignment.userId = :userId', { userId })
      .andWhere('role.name = :roleName', { roleName });

    if (organizationId) {
      query.andWhere('assignment.organizationId = :organizationId', { organizationId });
    }

    if (teamId) {
      query.andWhere('assignment.teamId = :teamId', { teamId });
    }

    const assignment = await query.getOne();
    return !!assignment;
  }

  /**
   * Получить все права пользователя в контексте команды/организации
   */
  async getUserPermissions(
    userId: string,
    organizationId?: string,
    teamId?: string,
  ): Promise<string[]> {
    const assignments = await this.getUserRoles(userId, organizationId, teamId);
    
    const permissions = new Set<string>();
    
    for (const assignment of assignments) {
      if (assignment.role?.permissions) {
        assignment.role.permissions.forEach(permission => {
          permissions.add(permission.name);
        });
      }
    }

    return Array.from(permissions);
  }
}
