import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { Invitation } from './entities/invitation.entity';
import { User } from '../../../users/entities/user.entity';
import { UserRoleAssignment } from '../../../users/entities/user-role-assignment.entity';
import { Role } from '../../../rbac/entities/role.entity';
import { Team } from '../../../teams/entities/team.entity';
import { TeamRole } from '../../../teams/entities/team-role.entity';
import { TeamMembership } from '../../../teams/entities/team-membership.entity';
import { Organization } from '../../../organizations/entities/organization.entity';
import { OrganizationRole } from '../../../organizations/entities/organization-role.entity';
import { OrganizationMembership } from '../../../organizations/entities/organization-membership.entity';
import { EmailService } from '../../email.service';
import { UsersModule } from '../../../users/users.module';
import { RbacModule } from '../../../rbac/rbac.module';
import { NotificationsModule } from '../../../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invitation, User, UserRoleAssignment, Role, Team, TeamRole, TeamMembership, Organization, OrganizationRole, OrganizationMembership]),
    UsersModule,
    RbacModule,
    NotificationsModule,
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService, EmailService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
