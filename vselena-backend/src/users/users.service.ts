import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Invitation } from '../auth/micro-modules/invitations/entities/invitation.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Invitation)
    private invitationsRepo: Repository<Invitation>,
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

  /**
   * Получение сотрудников команд пользователя
   */
  async getTeamMembers(userId: string): Promise<User[]> {
    // Получаем команды, которые пользователь создал или в которых является членом
    const teams = await this.usersRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.teams', 'userTeams')
      .leftJoinAndSelect('teams', 'createdTeams', 'createdTeams.createdBy = user.id')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!teams) {
      return [];
    }

    // Собираем все ID команд (созданные + членство)
    const teamIds = new Set<string>();
    
    // Команды, в которых пользователь является членом
    if (teams.teams) {
      teams.teams.forEach(team => teamIds.add(team.id));
    }

    // Команды, которые пользователь создал
    const createdTeams = await this.usersRepo
      .createQueryBuilder()
      .select('team.id')
      .from('teams', 'team')
      .where('team.createdBy = :userId', { userId })
      .getRawMany();

    createdTeams.forEach(team => teamIds.add(team.team_id));

    if (teamIds.size === 0) {
      return [];
    }

    // Получаем всех пользователей из этих команд
    const teamMembers = await this.usersRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.teams', 'team')
      .leftJoinAndSelect('user.userRoleAssignments', 'userRoleAssignments')
      .leftJoinAndSelect('user.organizations', 'organizations')
      .where('team.id IN (:...teamIds)', { teamIds: Array.from(teamIds) })
      .andWhere('user.id != :userId', { userId }) // Исключаем самого пользователя
      .getMany();

    return teamMembers;
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

    // Обновляем команду пользователя
    await this.usersRepo.update(userId, { teamId });

    // Обновляем связь в таблице user_teams
    // Сначала удаляем старые связи
    await this.usersRepo
      .createQueryBuilder()
      .relation(User, 'teams')
      .of(userId)
      .remove(await this.usersRepo
        .createQueryBuilder()
        .relation(User, 'teams')
        .of(userId)
        .loadMany()
      );

    // Добавляем новую связь
    if (teamId) {
      await this.usersRepo
        .createQueryBuilder()
        .relation(User, 'teams')
        .of(userId)
        .add(teamId);
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

    // Обновляем организацию пользователя
    await this.usersRepo.update(userId, { organizationId });

    // Обновляем связь в таблице user_organizations
    // Сначала удаляем старые связи
    await this.usersRepo
      .createQueryBuilder()
      .relation(User, 'organizations')
      .of(userId)
      .remove(await this.usersRepo
        .createQueryBuilder()
        .relation(User, 'organizations')
        .of(userId)
        .loadMany()
      );

    // Добавляем новую связь
    if (organizationId) {
      await this.usersRepo
        .createQueryBuilder()
        .relation(User, 'organizations')
        .of(userId)
        .add(organizationId);
    }

    // Возвращаем обновленного пользователя
    const updatedUser = await this.findById(userId);
    if (!updatedUser) {
      throw new NotFoundException('Updated user not found');
    }
    return updatedUser;
  }
}
