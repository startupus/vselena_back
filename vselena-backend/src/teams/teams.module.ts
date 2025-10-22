import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { Team } from './entities/team.entity';
import { User } from '../users/entities/user.entity';
import { UserRoleAssignment } from '../users/entities/user-role-assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Team, User, UserRoleAssignment])],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
