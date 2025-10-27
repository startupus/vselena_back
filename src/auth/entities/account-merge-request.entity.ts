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
import type { MergeConflicts, MergeResolution } from '../interfaces/multi-auth.interface';

@Entity('account_merge_requests')
export class AccountMergeRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  primaryUserId: string;

  @Column({ type: 'uuid' })
  secondaryUserId: string;

  @Column({ type: 'varchar', length: 50 })
  authMethod: string; // Метод аутентификации, который вызвал конфликт

  @Column({ type: 'jsonb' })
  conflicts: MergeConflicts;

  @Column({ type: 'jsonb', nullable: true })
  resolution: MergeResolution | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'resolved' | 'rejected' | 'expired';

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'primaryUserId' })
  primaryUser: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'secondaryUserId' })
  secondaryUser: User;
}
