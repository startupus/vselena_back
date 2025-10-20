import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Team } from '../../teams/entities/team.entity';
import { Role } from '../../rbac/entities/role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false, nullable: true })
  passwordHash: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'uuid', nullable: true })
  organizationId: string | null;

  @Column({ type: 'uuid', nullable: true })
  teamId: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  // ========== 2FA НАСТРОЙКИ ==========
  @Column({ type: 'boolean', default: false })
  twoFactorEnabled: boolean;

  @Column({ type: 'text', array: true, default: '{}' })
  twoFactorMethods: string[]; // ['email', 'sms', 'totp']

  @Column({ type: 'boolean', default: false })
  phoneVerified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  twoFactorSecret: string; // TOTP секрет

  @Column({ type: 'text', array: true, nullable: true, select: false })
  backupCodes: string[]; // Резервные коды

  @Column({ type: 'text', array: true, default: '{}', select: false })
  twoFactorBackupCodesUsed: string[]; // Использованные резервные коды

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Organization, (organization) => organization.users, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => Team, (team) => team.users, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
  })
  roles: Role[];

  @ManyToMany(() => Organization, (organization) => organization.members)
  @JoinTable({
    name: 'user_organizations',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'organization_id', referencedColumnName: 'id' },
  })
  organizations: Organization[];

  @ManyToMany(() => Team, (team) => team.members)
  @JoinTable({
    name: 'user_teams',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'team_id', referencedColumnName: 'id' },
  })
  teams: Team[];

  // ========== РЕФЕРАЛЬНАЯ СИСТЕМА ==========
  @OneToMany('Referral', 'referrer')
  referrals: any[];

  @OneToMany('Referral', 'referredUser')
  referredBy: any[];
}
