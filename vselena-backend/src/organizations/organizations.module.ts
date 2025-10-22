import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { Organization } from './entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { UserRoleAssignment } from '../users/entities/user-role-assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, User, UserRoleAssignment])],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
