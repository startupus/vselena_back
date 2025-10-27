import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Organization } from './organization.entity';
import { OrganizationMembership } from './organization-membership.entity';

@Entity('organization_roles')
export class OrganizationRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'organizationId' })
  organizationId: string;

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
  @ManyToOne(() => Organization, organization => organization.roles, { onDelete: 'CASCADE' })
  organization: Organization;

  @OneToMany(() => OrganizationMembership, membership => membership.role)
  memberships: OrganizationMembership[];
}
