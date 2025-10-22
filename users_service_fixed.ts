import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRoleAssignment } from './entities/user-role-assignment.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(UserRoleAssignment)
    private userRoleAssignmentRepo: Repository<UserRoleAssignment>,
  ) {}

  async create(createUserDto: Partial<User>): Promise<User> {
    const user = this.usersRepo.create(createUserDto);
    return this.usersRepo.save(user);
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const [users, total] = await this.usersRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['organizations', 'teams'],
    });

    return {
      data: users,
      total,
      page,
      limit,
    };
  }

  async findById(id: string, options?: { select?: string[]; relations?: string[] }): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { id },
      select: options?.select as any,
      relations: options?.relations as any,
    });
  }

  async update(id: string, updateUserDto: Partial<User>): Promise<User> {
    await this.usersRepo.update(id, updateUserDto);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.usersRepo.delete(id);
  }

  async updateUserTeam(userId: string, teamId: string, currentUserId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Удаляем из всех команд
    await this.usersRepo
      .createQueryBuilder()
      .relation(User, 'teams')
      .of(userId)
      .remove(await this.usersRepo
        .createQueryBuilder()
        .relation(User, 'teams')
        .of(userId)
        .loadMany());

    // Добавляем в новую команду
    if (teamId) {
      await this.usersRepo
        .createQueryBuilder()
        .relation(User, 'teams')
        .of(userId)
        .add(teamId);
    }

    return this.findById(userId, { relations: ['organizations', 'teams'] });
  }

  async updateUserOrganization(userId: string, organizationId: string, currentUserId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Удаляем из всех организаций
    await this.usersRepo
      .createQueryBuilder()
      .relation(User, 'organizations')
      .of(userId)
      .remove(await this.usersRepo
        .createQueryBuilder()
        .relation(User, 'organizations')
        .of(userId)
        .loadMany());

    // Добавляем в новую организацию
    if (organizationId) {
      await this.usersRepo
        .createQueryBuilder()
        .relation(User, 'organizations')
        .of(userId)
        .add(organizationId);
    }

    return this.findById(userId, { relations: ['organizations', 'teams'] });
  }

  async getTeamMembers(userId: string): Promise<User[]> {
    // Получаем команды и организации текущего пользователя
    const currentUser = await this.findById(userId, { relations: ['organizations', 'teams'] });
    if (!currentUser) {
      return [];
    }

    const userOrgIds = currentUser.organizations?.map(org => org.id) || [];
    const userTeamIds = currentUser.teams?.map(team => team.id) || [];

    console.log(`🔍 Current user ${currentUser.email} has orgs: ${userOrgIds.length}, teams: ${userTeamIds.length}`);

    if (userOrgIds.length === 0 && userTeamIds.length === 0) {
      console.log(`❌ User ${currentUser.email} has no organizations or teams`);
      return []; // У пользователя нет команд/организаций
    }

    // Находим пользователей, которые состоят в тех же командах/организациях
    const query = this.usersRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organizations', 'organizations')
      .leftJoinAndSelect('user.teams', 'teams')
      .where('user.id != :userId', { userId })
      .andWhere('user.isActive = :isActive', { isActive: true });

    // Фильтруем по организациям или командам
    if (userOrgIds.length > 0 && userTeamIds.length > 0) {
      query.andWhere(
        '(organizations.id IN (:...orgIds) OR teams.id IN (:...teamIds))',
        { orgIds: userOrgIds, teamIds: userTeamIds }
      );
    } else if (userOrgIds.length > 0) {
      query.andWhere('organizations.id IN (:...orgIds)', { orgIds: userOrgIds });
    } else if (userTeamIds.length > 0) {
      query.andWhere('teams.id IN (:...teamIds)', { teamIds: userTeamIds });
    }

    const users = await query.getMany();
    console.log(`🔍 Found ${users.length} users for filtering`);

    // Фильтруем пользователей без команд/организаций
    const filteredUsers = users.filter(user => 
      (user.organizations && user.organizations.length > 0) || 
      (user.teams && user.teams.length > 0)
    );

    console.log(`🔍 After filtering: ${filteredUsers.length} users`);
    return filteredUsers;
  }

  async transferUserBetweenTeams(
    userId: string, 
    fromTeamId: string | null, 
    toTeamId: string | null, 
    currentUserId: string
  ): Promise<User> {
    console.log(`🔄 Transferring user ${userId} from team ${fromTeamId} to team ${toTeamId}`);
    
    const user = await this.findById(userId, { relations: ['teams'] });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Проверяем, не состоит ли пользователь уже в целевой команде
    if (toTeamId && user.teams?.some(team => team.id === toTeamId)) {
      console.log(`⚠️ User ${userId} is already in team ${toTeamId}`);
      throw new Error('Пользователь уже состоит в этой команде');
    }

    // Удаляем из старой команды
    if (fromTeamId) {
      console.log(`🗑️ Removing user ${userId} from team ${fromTeamId}`);
      await this.usersRepo
        .createQueryBuilder()
        .relation(User, 'teams')
        .of(userId)
        .remove(fromTeamId);
    }

    // Добавляем в новую команду
    if (toTeamId) {
      console.log(`➕ Adding user ${userId} to team ${toTeamId}`);
      await this.usersRepo
        .createQueryBuilder()
        .relation(User, 'teams')
        .of(userId)
        .add(toTeamId);
    }

    const updatedUser = await this.findById(userId, { relations: ['organizations', 'teams'] });
    console.log(`✅ User ${userId} transferred successfully`);
    return updatedUser;
  }
}
