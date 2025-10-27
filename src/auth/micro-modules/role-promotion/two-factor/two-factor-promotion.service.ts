import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../../users/entities/user.entity';
import { Role } from '../../../../rbac/entities/role.entity';
import { RolePromotionCondition } from '../../base/role-promotion.interface';

@Injectable()
export class TwoFactorPromotionService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  /**
   * Условие: пользователь включил 2FA
   */
  async checkTwoFactorEnabled(user: User): Promise<boolean> {
    return user.twoFactorEnabled === true;
  }

  /**
   * Действие: повысить роль до editor при включении 2FA
   */
  async promoteOnTwoFactorEnabled(user: User): Promise<void> {
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
      console.log(`🔐 Пользователь ${user.email} повышен до editor после включения 2FA`);
    }
  }

  /**
   * Получить условие для проверки
   */
  getPromotionCondition(): RolePromotionCondition {
    return {
      id: 'two-factor-enabled',
      name: 'Включение 2FA',
      description: 'Пользователь получает роль "editor" после включения двухфакторной аутентификации',
      check: this.checkTwoFactorEnabled.bind(this),
      apply: this.promoteOnTwoFactorEnabled.bind(this),
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
