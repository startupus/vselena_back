import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { Organization } from './entities/organization.entity';
import { OrganizationRole } from './entities/organization-role.entity';
import { OrganizationMembership } from './entities/organization-membership.entity';
import { TeamMembership } from '../teams/entities/team-membership.entity';
import { Team } from '../teams/entities/team.entity';
import { TeamRole } from '../teams/entities/team-role.entity';
import { User } from '../users/entities/user.entity';
import { UserRoleAssignment } from '../users/entities/user-role-assignment.entity';
import { Role } from '../rbac/entities/role.entity';
import { RoleHierarchyService } from '../rbac/role-hierarchy.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization, 
      OrganizationRole, 
      OrganizationMembership,
      TeamMembership,
      Team,
      TeamRole,
      User, 
      UserRoleAssignment,
      Role
    ])
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, RoleHierarchyService],
  exports: [OrganizationsService, RoleHierarchyService],
})
export class OrganizationsModule {}
