import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRoleAssignment } from './entities/user-role-assignment.entity';
import { User } from './entities/user.entity';
import { Role } from '../rbac/entities/role.entity';

@Injectable()
export class UserRoleAssignmentService {
  constructor(
    @InjectRepository(UserRoleAssignment)
    private userRoleAssignmentRepo: Repository<UserRoleAssignment>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Role)
    private rolesRepo: Repository<Role>,
  ) {}

  async assignRole(
    userId: string,
    roleId: string,
    organizationId?: string,
    teamId?: string,
    assignedBy?: string,
    expiresAt?: Date,
  ): Promise<UserRoleAssignment> {
    // РџСЂРѕРІРµСЂСЏРµРј, С‡С‚Рѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ СЃСѓС‰РµСЃС‚РІСѓРµС‚
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['organizations', 'teams'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // РџСЂРѕРІРµСЂСЏРµРј, С‡С‚Рѕ СЂРѕР»СЊ СЃСѓС‰РµСЃС‚РІСѓРµС‚
    const role = await this.rolesRepo.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // РџСЂРѕРІРµСЂСЏРµРј, С‡С‚Рѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ СЏРІР»СЏРµС‚СЃСЏ С‡Р»РµРЅРѕРј РѕСЂРіР°РЅРёР·Р°С†РёРё/РєРѕРјР°РЅРґС‹
    if (organizationId && !user.organizations?.some(org => org.id === organizationId)) {
      throw new ForbiddenException('User is not a member of the organization');
    }

    if (teamId && !user.teams?.some(team => team.id === teamId)) {
      throw new ForbiddenException('User is not a member of the team');
    }

    // РЈРґР°Р»СЏРµРј СЃСѓС‰РµСЃС‚РІСѓСЋС‰РµРµ РЅР°Р·РЅР°С‡РµРЅРёРµ СЂРѕР»Рё
    await this.userRoleAssignmentRepo.delete({
      userId,
      roleId,
      organizationId,
      teamId,
    });

    // РЎРѕР·РґР°РµРј РЅРѕРІРѕРµ РЅР°Р·РЅР°С‡РµРЅРёРµ СЂРѕР»Рё
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

  async removeRole(
    userId: string,
    roleId: string,
    organizationId?: string,
    teamId?: string,
  ): Promise<void> {
    const result = await this.userRoleAssignmentRepo.delete({
      userId,
      roleId,
      organizationId,
      teamId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Role assignment not found');
    }
  }

  async getUserRoles(
    userId: string,
    organizationId?: string,
    teamId?: string,
  ): Promise<UserRoleAssignment[]> {
    const query = this.userRoleAssignmentRepo
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.role', 'role')
      .leftJoinAndSelect('assignment.user', 'user')
      .where('assignment.userId = :userId', { userId });

    if (organizationId) {
      query.andWhere('assignment.organizationId = :organizationId', { organizationId });
    }

    if (teamId) {
      query.andWhere('assignment.teamId = :teamId', { teamId });
    }

    return query.getMany();
  }

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

  async getUserPermissions(
    userId: string,
    organizationId?: string,
    teamId?: string,
  ): Promise<string[]> {
    const assignments = await this.getUserRoles(userId, organizationId, teamId);
    const permissions = new Set<string>();

    for (const assignment of assignments) {
      if (assignment.role && assignment.role.permissions) {
        for (const permission of assignment.role.permissions) {
          permissions.add(permission.name);
        }
      }
    }

    return Array.from(permissions);
  }
}
