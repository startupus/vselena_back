import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../../../users/entities/user.entity';
import { Organization } from '../../../../organizations/entities/organization.entity';
import { Team } from '../../../../teams/entities/team.entity';
import { Role } from '../../../../rbac/entities/role.entity';

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

  @Column({ type: 'enum', enum: InvitationType })
  type: InvitationType;

  @Column({ nullable: true })
  organizationId?: string;

  @Column({ nullable: true })
  teamId?: string;

  @Column({ type: 'enum', enum: InvitationStatus, default: InvitationStatus.PENDING })
  status: InvitationStatus;

  @Column({ nullable: true })
  role?: string;

  @Column({ type: 'uuid', nullable: true })
  invitedById: string;

  @Column({ type: 'uuid', nullable: true })
  acceptedById?: string;

  @Column({ nullable: true })
  token: string;

  @Column({ type: 'timestamp', nullable: false, name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'accepted_at' })
  acceptedAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'declined_at' })
  declinedAt?: Date;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
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