import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Team } from './team.entity';
import { TeamMembership } from './team-membership.entity';

@Entity('team_roles')
export class TeamRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'teamId' })
  teamId: string;

  @Column({ type: 'jsonb', default: [] })
  permissions: string[];

  @Column({ type: 'int', default: 0 })
  level: number;

  @Column({ default: false })
  isSystem: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Team, team => team.roles, { onDelete: 'CASCADE' })
  team: Team;

  @OneToMany(() => TeamMembership, membership => membership.role)
  memberships: TeamMembership[];
}
