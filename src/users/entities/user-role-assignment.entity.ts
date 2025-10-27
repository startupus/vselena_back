import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Role } from '../../rbac/entities/role.entity';
import { OrganizationRole } from '../../organizations/entities/organization-role.entity';
import { TeamRole } from '../../teams/entities/team-role.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Team } from '../../teams/entities/team.entity';

@Entity('user_role_assignments')
export class UserRoleAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  // Глобальная роль (из таблицы roles)
  @Column({ type: 'uuid', nullable: true })
  roleId: string | null;

  // Роль организации (из таблицы organization_roles)
  @Column({ type: 'uuid', nullable: true })
  organizationRoleId: string | null;

  // Роль команды (из таблицы team_roles)
  @Column({ type: 'uuid', nullable: true })
  teamRoleId: string | null;

  @Column({ type: 'uuid', nullable: true })
  organizationId: string | null;

  @Column({ type: 'uuid', nullable: true })
  teamId: string | null;

  @Column({ type: 'uuid', nullable: true })
  assignedBy: string | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Глобальная роль
  @ManyToOne(() => Role, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'roleId' })
  role: Role | null;

  // Роль организации
  @ManyToOne(() => OrganizationRole, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'organizationRoleId' })
  organizationRole: OrganizationRole | null;

  // Роль команды
  @ManyToOne(() => TeamRole, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'teamRoleId' })
  teamRole: TeamRole | null;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization | null;

  @ManyToOne(() => Team, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'teamId' })
  team: Team | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assignedBy' })
  assignedByUser: User | null;
}
