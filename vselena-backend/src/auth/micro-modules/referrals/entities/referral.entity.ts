import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../../../users/entities/user.entity';

export enum ReferralStatus {
  PENDING = 'pending',
  CONVERTED = 'converted',
  EXPIRED = 'expired',
}

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  referrerId: string;

  @ManyToOne(() => User, (user) => user.referrals, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'referrerId' })
  referrer: User;

  @Column({ type: 'uuid', nullable: true })
  referredUserId: string | null;

  @ManyToOne(() => User, (user) => user.referredBy, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'referredUserId' })
  referredUser: User | null;

  @Column({ unique: true })
  referralCode: string;

  @Column({ type: 'enum', enum: ReferralStatus, default: ReferralStatus.PENDING })
  status: ReferralStatus;

  @Column({ nullable: true })
  convertedAt: Date;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
