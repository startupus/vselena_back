import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Organization } from './organization.entity';
import { OrganizationRole } from './organization-role.entity';

@Entity('organization_memberships')
export class OrganizationMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'userId' })
  userId: string;

  @Column({ name: 'organizationId' })
  organizationId: string;

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
  @ManyToOne(() => User, user => user.organizationMemberships, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Organization, organization => organization.memberships, { onDelete: 'CASCADE' })
  organization: Organization;

  @ManyToOne(() => OrganizationRole, role => role.memberships, { onDelete: 'CASCADE' })
  role: OrganizationRole;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  inviter: User;
}
