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
import { UserRoleAssignment } from './user-role-assignment.entity';
import { OrganizationMembership } from '../../organizations/entities/organization-membership.entity';
import { TeamMembership } from '../../teams/entities/team-membership.entity';
import { AuthMethodType } from '../../auth/enums/auth-method-type.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email: string | null;

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

  // ✅ НОВЫЕ ПОЛЯ для мульти-аутентификации
  @Column({ type: 'varchar', length: 255, nullable: true })
  githubId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  githubUsername: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gosuslugiId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  vkontakteId: string | null;

  // Основной способ входа
  @Column({ type: 'enum', enum: AuthMethodType, default: AuthMethodType.EMAIL })
  primaryAuthMethod: AuthMethodType;

  // Активные способы аутентификации
  @Column({ type: 'jsonb', default: '["EMAIL"]' })
  availableAuthMethods: AuthMethodType[];

  // Удалены одиночные связи - теперь только ManyToMany

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  // ✅ НОВЫЕ СТАТУСЫ ВЕРИФИКАЦИИ
  @Column({ type: 'boolean', default: false })
  phoneVerified: boolean;

  @Column({ type: 'boolean', default: false })
  githubVerified: boolean;

  @Column({ type: 'boolean', default: false })
  gosuslugiVerified: boolean;

  @Column({ type: 'boolean', default: false })
  vkontakteVerified: boolean;

  // Настройки MFA
  @Column({ type: 'jsonb', nullable: true })
  mfaSettings: {
    enabled: boolean;
    methods: string[];
    backupCodes: string[];
    backupCodesUsed: string[];
    requiredMethods: number;
  } | null;

  // Предпочтения мессенджеров
  @Column({ type: 'jsonb', nullable: true })
  messengerPreferences: {
    preferredMessenger: 'whatsapp' | 'telegram' | 'both';
    whatsappEnabled: boolean;
    telegramEnabled: boolean;
  } | null;

  // Метаданные от OAuth провайдеров
  @Column({ type: 'jsonb', nullable: true })
  oauthMetadata: {
    github?: any;
    gosuslugi?: any;
    vkontakte?: any;
  } | null;

  // Метаданные мессенджеров
  @Column({ type: 'jsonb', nullable: true })
  messengerMetadata: {
    whatsapp?: { phoneNumber: string; profileName?: string; };
    telegram?: { userId: number; username?: string; };
  } | null;

  // ========== 2FA НАСТРОЙКИ (LEGACY) ==========
  @Column({ type: 'boolean', default: false })
  twoFactorEnabled: boolean;

  @Column({ type: 'text', array: true, default: '{}' })
  twoFactorMethods: string[]; // ['email', 'sms', 'totp']

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

  // Удалены одиночные связи - теперь только ManyToMany

  // Роли теперь через UserRoleAssignment entity
  @OneToMany(() => UserRoleAssignment, (assignment) => assignment.user)
  userRoleAssignments: UserRoleAssignment[];

  @ManyToMany(() => Organization, (organization) => organization.members)
  @JoinTable({
    name: 'user_organizations',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'organizationId', referencedColumnName: 'id' },
  })
  organizations: Organization[];

  @ManyToMany(() => Team, (team) => team.members)
  @JoinTable({
    name: 'user_teams',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'teamId', referencedColumnName: 'id' },
  })
  teams: Team[];

  // ========== РЕФЕРАЛЬНАЯ СИСТЕМА ==========
  @OneToMany('Referral', 'referrer')
  referrals: any[];

  // ========== ОРГАНИЗАЦИОННЫЕ И КОМАНДНЫЕ РОЛИ ==========
  @OneToMany(() => OrganizationMembership, membership => membership.user)
  organizationMemberships: OrganizationMembership[];

  @OneToMany(() => TeamMembership, membership => membership.user)
  teamMemberships: TeamMembership[];

  @OneToMany('Referral', 'referredUser')
  referredBy: any[];
}
