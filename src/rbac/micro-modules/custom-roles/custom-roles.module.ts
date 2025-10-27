import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomRolesService } from './custom-roles.service';
import { CustomRolesController } from './custom-roles.controller';
import { CustomRolesMicroModule } from './custom-roles.micro-module';
import { Role } from '../../entities/role.entity';
import { Permission } from '../../entities/permission.entity';
import { User } from '../../../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission, User]),
  ],
  controllers: [CustomRolesController],
  providers: [CustomRolesService, CustomRolesMicroModule],
  exports: [CustomRolesService, CustomRolesMicroModule],
})
export class CustomRolesModule {}
