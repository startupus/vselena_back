import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Team } from './entities/team.entity';
import { User } from '../users/entities/user.entity';
import { UserRoleAssignment } from '../users/entities/user-role-assignment.entity';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamsRepo: Repository<Team>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(UserRoleAssignment)
    private userRoleAssignmentRepo: Repository<UserRoleAssignment>,
  ) {}

  async create(teamData: Partial<Team>, creatorId?: string): Promise<Team> {
    if (!creatorId) {
      throw new BadRequestException('Creator ID is required');
    }

    // Проверяем, что пользователь существует и имеет организацию
    const user = await this.usersRepo.findOne({
      where: { id: creatorId },
      relations: ['organizations'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.organizations || user.organizations.length === 0) {
      throw new BadRequestException('Вы должны сначала создать организацию, чтобы создать команду');
    }

    // Команда создается в организации пользователя
    const organizationId = teamData.organizationId || user.organizations[0].id;

    // Проверяем, что organizationId принадлежит пользователю
    const userOrganization = user.organizations.find(org => org.id === organizationId);
    if (!userOrganization) {
      throw new BadRequestException('Вы можете создавать команды только в своей организации');
    }

    const team = this.teamsRepo.create({
      ...teamData,
      organizationId,
      createdBy: creatorId,
    });
    const savedTeam = await this.teamsRepo.save(team);
    
    // ИСПРАВЛЕНО: НЕ добавляем создателя автоматически в команду
    // Владелец организации должен принадлежать только организации, а не командам
    // Команды предназначены для сотрудников, а не для владельца
    
    console.log(`✅ Команда ${savedTeam.name} создана в организации ${organizationId}`);
    console.log(`ℹ️ Создатель НЕ добавлен в команду (владелец организации не должен быть членом команд)`);
    
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
        // УПРОЩЕННАЯ ЛОГИКА: Показываем все команды организаций пользователя
        if (!userId) {
          return [];
        }

        // Получаем организации пользователя
        const currentUser = await this.usersRepo.findOne({
          where: { id: userId },
          relations: ['organizations'],
        });

        if (!currentUser || !currentUser.organizations || currentUser.organizations.length === 0) {
          return [];
        }

        const userOrgIds = currentUser.organizations.map(org => org.id);

        // Получаем все команды организаций пользователя
        const teams = await this.teamsRepo.find({
          where: { organizationId: In(userOrgIds) },
          relations: ['organization', 'members', 'roles'],
        });

        return teams;
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
      relations: ['organization', 'members', 'roles'],
    });
  }

  async findById(id: string): Promise<Team | null> {
    return this.teamsRepo.findOne({
      where: { id },
      relations: ['organization', 'members', 'roles'],
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
   * Добавление пользователя в команду (ManyToMany)
   */
  async addUserToTeam(
    teamId: string,
    userId: string,
  ): Promise<void> {
    const team = await this.findById(teamId);
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Добавляем команду к пользователю через User.teams
    await this.usersRepo
      .createQueryBuilder()
      .relation(User, 'teams')
      .of(userId)
      .add(teamId);

    console.log(`✅ Пользователь ${userId} добавлен в команду ${teamId}`);
  }

  /**
   * Удаление пользователя из команды (ManyToMany)
   */
  async removeUserFromTeam(
    teamId: string,
    userId: string
  ): Promise<void> {
    const team = await this.findById(teamId);
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Удаляем команду у пользователя через User.teams
    await this.usersRepo
      .createQueryBuilder()
      .relation(User, 'teams')
      .of(userId)
      .remove(teamId);

    console.log(`✅ Пользователь ${userId} удален из команды ${teamId}`);
  }

  /**
   * Получение участников команды
   */
  async getTeamMembers(teamId: string): Promise<any[]> {
    console.log(`🔍 Getting members for team ${teamId}`);
    
    const team = await this.teamsRepo.findOne({
      where: { id: teamId },
      relations: ['members'],
    });

    if (!team) {
      console.log(`❌ Team ${teamId} not found`);
      throw new NotFoundException('Team not found');
    }

    console.log(`🔍 Team ${team.name} has ${team.members?.length || 0} members`);

    if (!team.members || team.members.length === 0) {
      console.log(`❌ Team ${team.name} has no members`);
      return [];
    }

    // Получаем роли пользователей в контексте команды
    const userRoleAssignments = await this.userRoleAssignmentRepo
      .createQueryBuilder('ura')
      .leftJoinAndSelect('ura.role', 'role')
      .where('ura.teamId = :teamId', { teamId })
      .andWhere('ura.userId IN (:...userIds)', { 
        userIds: team.members.map(member => member.id)
      })
      .getMany();

    console.log(`🔍 Found ${userRoleAssignments.length} role assignments for team ${teamId}`);

    const result = team.members.map(user => {
      // Находим роль пользователя в этой команде
      const userRole = userRoleAssignments.find(ura => ura.userId === user.id);
      
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        role: userRole?.role?.name || 'viewer', // Роль в этой команде
        roleDescription: userRole?.role?.description || 'Наблюдатель',
      };
    });

    console.log(`✅ Returning ${result.length} team members`);
    return result;
  }
}
