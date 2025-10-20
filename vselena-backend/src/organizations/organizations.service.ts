import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepo: Repository<Organization>,
  ) {}

  async create(organizationData: Partial<Organization>, creatorId?: string): Promise<Organization> {
    const organization = this.organizationsRepo.create({
      ...organizationData,
      createdBy: creatorId,
    });
    const savedOrganization = await this.organizationsRepo.save(organization);
    
    // НЕ добавляем создателя автоматически в организацию
    // Пользователь может быть членом только одной организации одновременно
    // Для super_admin это не нужно, так как он должен видеть все организации
    
    return savedOrganization;
  }

      async findAll(userId?: string): Promise<Organization[]> {
        const query = this.organizationsRepo.createQueryBuilder('organization')
          .leftJoinAndSelect('organization.teams', 'teams')
          .leftJoinAndSelect('organization.users', 'users');

        // Если передан userId, показываем организации где пользователь является создателем ИЛИ участником
        if (userId) {
          query.where('(organization.createdBy = :userId OR users.id = :userId)', { userId });
        }

        return query.getMany();
      }

  async findById(id: string): Promise<Organization | null> {
    return this.organizationsRepo.findOne({
      where: { id },
      relations: ['teams', 'users', 'roles'],
    });
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
   * Добавление пользователя в организацию
   */
  async addUserToOrganization(
    organizationId: string,
    userId: string,
    role: string = 'member'
  ): Promise<void> {
    const organization = await this.findById(organizationId);
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Обновляем organizationId пользователя
    await this.organizationsRepo.query(
      'UPDATE users SET "organizationId" = $1 WHERE id = $2',
      [organizationId, userId]
    );

    console.log(`✅ Пользователь ${userId} добавлен в организацию ${organizationId} с ролью ${role}`);
  }

  /**
   * Удаление пользователя из организации
   */
  async removeUserFromOrganization(
    organizationId: string,
    userId: string
  ): Promise<void> {
    const organization = await this.findById(organizationId);
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Удаляем organizationId у пользователя
    await this.organizationsRepo.query(
      'UPDATE users SET "organizationId" = NULL WHERE id = $1',
      [userId]
    );

    console.log(`✅ Пользователь ${userId} удален из организации ${organizationId}`);
  }
}
