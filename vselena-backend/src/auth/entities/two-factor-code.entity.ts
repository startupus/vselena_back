import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TwoFactorType {
  EMAIL = 'email',
  SMS = 'sms',
}

export enum TwoFactorStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  EXPIRED = 'expired',
  USED = 'used',
}

@Entity('two_factor_codes')
@Index(['userId', 'type', 'status'])
@Index(['code', 'status'])
@Index(['expiresAt'])
export class TwoFactorCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: TwoFactorType,
  })
  type: TwoFactorType;

  @Column({ type: 'varchar', length: 6 })
  code: string; // 6-значный код

  @Column({
    type: 'enum',
    enum: TwoFactorStatus,
    default: TwoFactorStatus.PENDING,
  })
  status: TwoFactorStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contact: string; // email или номер телефона

  @Column({ type: 'varchar', length: 50, nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'int', default: 0 })
  attempts: number; // Количество попыток ввода

  @Column({ type: 'int', default: 3 })
  maxAttempts: number; // Максимальное количество попыток

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
