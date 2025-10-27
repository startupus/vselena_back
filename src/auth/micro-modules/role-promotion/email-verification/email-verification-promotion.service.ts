import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../../users/entities/user.entity';
import { Role } from '../../../../rbac/entities/role.entity';
import { RolePromotionCondition } from '../../base/role-promotion.interface';

@Injectable()
export class EmailVerificationPromotionService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  /**
   * Условие: пользователь подтвердил email
   */
  async checkEmailVerified(user: User): Promise<boolean> {
    return user.emailVerified === true;
  }

  /**
   * Действие: повысить роль до editor при подтверждении email
   */
  async promoteOnEmailVerification(user: User): Promise<void> {
    const editorRole = await this.rolesRepository.findOne({ 
      where: { name: 'editor' } 
    });
    
    if (editorRole && !user.userRoleAssignments?.some(a => a.role?.name === 'editor')) {
      // Создаем новое назначение роли
      const userRoleAssignment = this.usersRepository.manager.create('UserRoleAssignment', {
        userId: user.id,
        roleId: editorRole.id,
        organizationId: null,
        teamId: null,
        assignedBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await this.usersRepository.manager.save('UserRoleAssignment', userRoleAssignment);
      console.log(`📧 Пользователь ${user.email} повышен до editor после подтверждения email`);
    }
  }

  /**
   * Получить условие для проверки
   */
  getPromotionCondition(): RolePromotionCondition {
    return {
      id: 'email-verified',
      name: 'Подтверждение Email',
      description: 'Пользователь получает роль "editor" после подтверждения email',
      check: this.checkEmailVerified.bind(this),
      apply: this.promoteOnEmailVerification.bind(this),
    };
  }

  /**
   * Проверить и применить условие для пользователя
   */
  async checkAndApplyCondition(user: User): Promise<boolean> {
    const condition = this.getPromotionCondition();
    
    if (await condition.check(user)) {
      await condition.apply(user);
      return true;
    }
    
    return false;
  }
}
