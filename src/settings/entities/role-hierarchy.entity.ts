import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from '../../rbac/entities/role.entity';

@Entity('role_hierarchy')
export class RoleHierarchy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  roleId: string;

  @Column({ type: 'uuid', nullable: true })
  parentRoleId: string;

  @Column({ type: 'int', default: 0 })
  level: number;

  @Column({ type: 'boolean', default: true })
  canManageLower: boolean;

  @Column({ type: 'boolean', default: false })
  canManageEqual: boolean;

  @Column({ type: 'boolean', default: false })
  canManageHigher: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentRoleId' })
  parentRole: Role;
}
