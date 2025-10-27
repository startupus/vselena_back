import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Team } from './team.entity';
import { TeamRole } from './team-role.entity';

@Entity('team_memberships')
export class TeamMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'userId' })
  userId: string;

  @Column({ name: 'teamId' })
  teamId: string;

  @Column({ name: 'roleId' })
  roleId: string;

  @Column({ default: () => 'NOW()' })
  joinedAt: Date;

  @Column({ name: 'invitedBy', nullable: true })
  invitedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.teamMemberships, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Team, team => team.memberships, { onDelete: 'CASCADE' })
  team: Team;

  @ManyToOne(() => TeamRole, role => role.memberships, { onDelete: 'CASCADE' })
  role: TeamRole;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  inviter: User;
}
