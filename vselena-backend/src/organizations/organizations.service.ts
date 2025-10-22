import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { UserRoleAssignment } from '../users/entities/user-role-assignment.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepo: Repository<Organization>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(UserRoleAssignment)
    private userRoleAssignmentRepo: Repository<UserRoleAssignment>,
  ) {}

  async create(organizationData: Partial<Organization>, creatorId?: string): Promise<Organization> {
    if (!creatorId) {
      throw new BadRequestException('Creator ID is required');
    }

    // Проверяем, что пользователь еще не создал организацию
    const user = await this.usersRepo.findOne({
      where: { id: creatorId },
      relations: ['organizations'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // ОГРАНИЧЕНИЕ: Один пользователь может создать только одну организацию
    const createdOrganizations = await this.organizationsRepo
      .createQueryBuilder('organization')
      .where('organization.createdBy = :creatorId', { creatorId })
      .getCount();

    if (createdOrganizations > 0) {
      throw new BadRequestException('Вы уже создали организацию. Один пользователь может создать только одну организацию.');
    }

    // Создаем организацию
    const organization = this.organizationsRepo.create({
      ...organizationData,
      createdBy: creatorId,
    });
    const savedOrganization = await this.organizationsRepo.save(organization);
    
    // АВТОМАТИЧЕСКИ добавляем создателя в организацию через User.organizations
    await this.usersRepo
      .createQueryBuilder()
      .relation(User, 'organizations')
      .of(creatorId)
      .add(savedOrganization.id);

    console.log(`✅ Организация ${savedOrganization.name} создана пользователем ${creatorId}`);
    console.log(`✅ Создатель автоматически добавлен в организацию`);
    
    return savedOrganization;
  }

      async findAll(userId?: string): Promise<Organization[]> {
        // НОВАЯ АРХИТЕКТУРА: Пользователь видит все свои организации
        if (!userId) {
          return [];
        }

        // Получаем все организации пользователя
        const userRepo = this.organizationsRepo.manager.getRepository('User');
        const currentUser = await userRepo.findOne({
          where: { id: userId },
          relations: ['organizations'],
        });

        if (!currentUser || !currentUser.organizations || currentUser.organizations.length === 0) {
          return [];
        }

        const orgIds = currentUser.organizations.map(org => org.id);

        // Получаем все организации пользователя
        const organizations = await this.organizationsRepo
          .createQueryBuilder('organization')
          .leftJoinAndSelect('organization.teams', 'teams')
          .leftJoinAndSelect('organization.members', 'members')
          .leftJoinAndSelect('organization.roles', 'roles')
          .where('organization.id IN (:...orgIds)', { orgIds })
          .getMany();

        return organizations;
      }

  async findById(id: string): Promise<Organization | null> {
    return this.organizationsRepo.findOne({
      where: { id },
      relations: ['teams', 'users', 'roles'],
    });
  }

  /**
   * Получение участников организации
   * Показываем только сотрудников организации, исключая тех, кто состоит в командах этой организации
   */
  async getOrganizationMembers(organizationId: string): Promise<any[]> {
    console.log(`🔍 Getting members for organization ${organizationId}`);
    
    const organization = await this.organizationsRepo.findOne({
      where: { id: organizationId },
      relations: ['members', 'teams', 'teams.members'],
    });

    if (!organization) {
      console.log(`❌ Organization ${organizationId} not found`);
      throw new NotFoundException('Organization not found');
    }

    console.log(`🔍 Organization ${organization.name} has ${organization.members?.length || 0} members`);

    if (!organization.members || organization.members.length === 0) {
      console.log(`❌ Organization ${organization.name} has no members`);
      return [];
    }

    // Получаем ID всех участников команд этой организации
    const teamMemberIds = new Set<string>();
    if (organization.teams) {
      organization.teams.forEach(team => {
        if (team.members) {
          team.members.forEach(member => {
            teamMemberIds.add(member.id);
          });
        }
      });
    }

    console.log(`🔍 Found ${teamMemberIds.size} team members in organization teams`);

    // Показываем ВСЕХ участников организации (включая тех, кто состоит в командах)
    const allOrganizationMembers = organization.members;

    console.log(`🔍 All organization members: ${allOrganizationMembers.length}`);

    if (allOrganizationMembers.length === 0) {
      console.log(`❌ No organization members found`);
      return [];
    }

    // Получаем роли пользователей в контексте организации
    const userRoleAssignments = await this.userRoleAssignmentRepo
      .createQueryBuilder('ura')
      .leftJoinAndSelect('ura.role', 'role')
      .where('ura.organizationId = :organizationId', { organizationId })
      .andWhere('ura.userId IN (:...userIds)', {
        userIds: allOrganizationMembers.map(member => member.id)
      })
      .getMany();

    console.log(`🔍 Found ${userRoleAssignments.length} role assignments for organization ${organizationId}`);

    const result = allOrganizationMembers.map(user => {
      // Находим роль пользователя в этой организации
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
        role: userRole?.role?.name || 'viewer', // Роль в этой организации
        roleDescription: userRole?.role?.description || 'Наблюдатель',
      };
    });

    console.log(`✅ Returning ${result.length} organization-only members`);
    return result;
  }

  async update(id: string, organizationData: Partial<Organization>): Promise<Organization> {
    const organization = await this.findById(id);
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    Object.assign(organization, organizationData);
    return this.organizationsRepo.save(organization);
  }

  async delete(id: string): Promise<void> {
    const result = await this.organizationsRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Organization not found');
    }
  }

  /**
   * Добавление пользователя в организацию (ManyToMany)
   */
  async addUserToOrganization(
    organizationId: string,
    userId: string,
  ): Promise<void> {
    const organization = await this.findById(organizationId);
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Добавляем организацию к пользователю через User.organizations
    await this.usersRepo
      .createQueryBuilder()
      .relation(User, 'organizations')
      .of(userId)
      .add(organizationId);

    console.log(`✅ Пользователь ${userId} добавлен в организацию ${organizationId}`);
  }

  /**
   * Удаление пользователя из организации (ManyToMany)
   */
  async removeUserFromOrganization(
    organizationId: string,
    userId: string
  ): Promise<void> {
    const organization = await this.findById(organizationId);
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Удаляем организацию у пользователя через User.organizations
    await this.usersRepo
      .createQueryBuilder()
      .relation(User, 'organizations')
      .of(userId)
      .remove(organizationId);

    console.log(`✅ Пользователь ${userId} удален из организации ${organizationId}`);
  }
}
