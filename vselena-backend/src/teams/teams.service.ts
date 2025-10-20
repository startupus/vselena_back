import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamsRepo: Repository<Team>,
  ) {}

  async create(teamData: Partial<Team>, creatorId?: string): Promise<Team> {
    const team = this.teamsRepo.create({
      ...teamData,
      createdBy: creatorId,
    });
    const savedTeam = await this.teamsRepo.save(team);
    
    // НЕ добавляем создателя автоматически в команду
    // Пользователь может быть членом только одной команды одновременно
    // Для super_admin это не нужно, так как он должен видеть все команды
    
    return savedTeam;
  }

  /**
   * Создание самостоятельной команды (не привязанной к организации)
   */
  async createStandaloneTeam(teamData: Omit<Partial<Team>, 'organizationId'>): Promise<Team> {
    const team = this.teamsRepo.create({
      ...teamData,
      organizationId: null, // Самостоятельная команда
    });
    return this.teamsRepo.save(team);
  }

  /**
   * Создание команды внутри организации
   */
  async createOrganizationTeam(
    organizationId: string,
    teamData: Omit<Partial<Team>, 'organizationId'>
  ): Promise<Team> {
    const team = this.teamsRepo.create({
      ...teamData,
      organizationId, // Команда внутри организации
    });
    return this.teamsRepo.save(team);
  }

      async findAll(organizationId?: string, userId?: string): Promise<Team[]> {
        const query = this.teamsRepo.createQueryBuilder('team')
          .leftJoinAndSelect('team.organization', 'organization')
          .leftJoinAndSelect('team.users', 'users')
          .leftJoinAndSelect('team.roles', 'roles');

        if (organizationId) {
          query.where('team.organizationId = :organizationId', { organizationId });
        }

        // Если передан userId, показываем команды где пользователь является создателем ИЛИ участником
        if (userId) {
          if (organizationId) {
            query.andWhere('(team.createdBy = :userId OR users.id = :userId)', { userId });
          } else {
            query.where('(team.createdBy = :userId OR users.id = :userId)', { userId });
          }
        }

        return query.getMany();
      }

  /**
   * Получение всех самостоятельных команд (не привязанных к организации)
   */
  async findStandaloneTeams(): Promise<Team[]> {
    return this.teamsRepo.find({
      where: { organizationId: null as any },
      relations: ['users', 'roles'],
    });
  }

  /**
   * Получение команд конкретной организации
   */
  async findTeamsByOrganization(organizationId: string): Promise<Team[]> {
    return this.teamsRepo.find({
      where: { organizationId },
      relations: ['organization', 'users', 'roles'],
    });
  }

  async findById(id: string): Promise<Team | null> {
    return this.teamsRepo.findOne({
      where: { id },
      relations: ['organization', 'users', 'roles'],
    });
  }

  async update(id: string, teamData: Partial<Team>): Promise<Team> {
    const team = await this.findById(id);
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    Object.assign(team, teamData);
    return this.teamsRepo.save(team);
  }

  async delete(id: string): Promise<void> {
    const result = await this.teamsRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Team not found');
    }
  }

  /**
   * Добавление пользователя в команду
   */
  async addUserToTeam(
    teamId: string,
    userId: string,
    role: string = 'member'
  ): Promise<void> {
    const team = await this.findById(teamId);
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Обновляем teamId пользователя
    await this.teamsRepo.query(
      'UPDATE users SET "teamId" = $1 WHERE id = $2',
      [teamId, userId]
    );

    console.log(`✅ Пользователь ${userId} добавлен в команду ${teamId} с ролью ${role}`);
  }

  /**
   * Удаление пользователя из команды
   */
  async removeUserFromTeam(
    teamId: string,
    userId: string
  ): Promise<void> {
    const team = await this.findById(teamId);
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Удаляем teamId у пользователя
    await this.teamsRepo.query(
      'UPDATE users SET "teamId" = NULL WHERE id = $1',
      [userId]
    );

    console.log(`✅ Пользователь ${userId} удален из команды ${teamId}`);
  }

  /**
   * Получение участников команды
   */
  async getTeamMembers(teamId: string): Promise<any[]> {
    const team = await this.teamsRepo.findOne({
      where: { id: teamId },
      relations: ['users'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return team.users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    }));
  }
}
