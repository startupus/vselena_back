import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TwoFactorSettingsService } from './two-factor-settings.service';
import { TwoFactorSettingsController } from './two-factor-settings.controller';
import { UserRoleManagementService } from './user-role-management.service';
import { UserRoleManagementController } from './user-role-management.controller';
import { User } from './entities/user.entity';
import { Role } from '../rbac/entities/role.entity';
import { Invitation } from '../auth/micro-modules/invitations/entities/invitation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Invitation])],
  controllers: [UsersController, TwoFactorSettingsController, UserRoleManagementController],
  providers: [UsersService, TwoFactorSettingsService, UserRoleManagementService],
  exports: [UsersService, TwoFactorSettingsService, UserRoleManagementService],
})
export class UsersModule {}
