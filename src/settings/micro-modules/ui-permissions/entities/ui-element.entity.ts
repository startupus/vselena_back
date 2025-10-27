import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UIGroup } from './ui-group.entity';

@Entity('ui_elements')
export class UIElement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  elementId: string;

  @Column({ type: 'varchar', length: 255 })
  componentName: string;

  @Column({ type: 'varchar', length: 500 })
  path: string;

  @Column({ type: 'varchar', length: 255 })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', default: '[]' })
  requiredPermissions: string[];

  @Column({ type: 'jsonb', default: '[]' })
  requiredRoles: string[];

  @Column({ type: 'jsonb', default: '{}' })
  conditions: Record<string, any>;

  @Column({ type: 'int', default: 100 })
  priority: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  groupId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => UIGroup, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'groupId' })
  group: UIGroup;
}
