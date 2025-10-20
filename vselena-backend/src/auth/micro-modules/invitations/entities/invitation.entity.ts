import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../../../users/entities/user.entity';
import { Organization } from '../../../../organizations/entities/organization.entity';
import { Team } from '../../../../teams/entities/team.entity';

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}

export enum InvitationType {
  ORGANIZATION = 'organization',
  TEAM = 'team',
}

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ type: 'enum', enum: InvitationType })
  type: InvitationType;

  @Column({ nullable: true })
  organizationId?: string;

  @Column({ nullable: true })
  teamId?: string;

  @Column({ type: 'enum', enum: InvitationStatus, default: InvitationStatus.PENDING })
  status: InvitationStatus;

  @Column({ nullable: true })
  roleId?: string;

  @Column({ nullable: true })
  invitedById: string;

  @Column({ nullable: true })
  acceptedById?: string;

  @Column({ nullable: true })
  token: string;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt?: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'invitedById' })
  invitedBy: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'acceptedById' })
  acceptedBy?: User;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organizationId' })
  organization?: Organization;

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'teamId' })
  team?: Team;
}