import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 100 })
  service: string; // 'auth', 'users', 'roles', 'permissions', etc.

  @Column({ type: 'varchar', length: 50 })
  action: string; // 'login', 'create', 'read', 'update', 'delete', etc.

  @Column({ type: 'varchar', length: 255, nullable: true })
  resource: string; // 'users', 'roles', 'permissions', etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  resourceId: string; // ID конкретного ресурса

  @Column({ type: 'jsonb', nullable: true })
  requestData: any; // Данные запроса

  @Column({ type: 'jsonb', nullable: true })
  responseData: any; // Данные ответа

  @Column({ type: 'int', default: 200 })
  statusCode: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent: string;

  // Роли пользователя на момент действия
  @Column({ type: 'jsonb' })
  userRoles: string[];

  // Права пользователя на момент действия
  @Column({ type: 'jsonb' })
  userPermissions: string[];

  // Организация пользователя
  @Column({ type: 'uuid', nullable: true })
  organizationId: string;

  // Команда пользователя
  @Column({ type: 'uuid', nullable: true })
  teamId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
