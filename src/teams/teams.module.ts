import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { Team } from './entities/team.entity';
import { TeamRole } from './entities/team-role.entity';
import { TeamMembership } from './entities/team-membership.entity';
import { OrganizationMembership } from '../organizations/entities/organization-membership.entity';
import { User } from '../users/entities/user.entity';
import { UserRoleAssignment } from '../users/entities/user-role-assignment.entity';
import { Role } from '../rbac/entities/role.entity';
import { RoleHierarchyService } from '../rbac/role-hierarchy.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Team, 
      TeamRole, 
      TeamMembership,
      OrganizationMembership,
      User, 
      UserRoleAssignment,
      Role
    ])
  ],
  controllers: [TeamsController],
  providers: [TeamsService, RoleHierarchyService],
  exports: [TeamsService, RoleHierarchyService],
})
export class TeamsModule {}
