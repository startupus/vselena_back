import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { Invitation } from './entities/invitation.entity';
import { User } from '../../../users/entities/user.entity';
import { Team } from '../../../teams/entities/team.entity';
import { Organization } from '../../../organizations/entities/organization.entity';
import { EmailService } from '../../email.service';
import { UsersModule } from '../../../users/users.module';
import { RbacModule } from '../../../rbac/rbac.module';
import { NotificationsModule } from '../../../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invitation, User, Team, Organization]),
    UsersModule,
    RbacModule,
    NotificationsModule,
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService, EmailService],
  exports: [InvitationsService],
})
export class InvitationsModule {}