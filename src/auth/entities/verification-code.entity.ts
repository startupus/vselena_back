import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { AuthMethodType } from '../enums/auth-method-type.enum';

@Entity('verification_codes')
@Index(['identifier', 'authMethod', 'purpose'])
@Index(['code', 'isUsed'])
@Index(['expiresAt'])
export class VerificationCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  identifier: string; // email, phone, или другой идентификатор

  @Column({ type: 'enum', enum: AuthMethodType })
  authMethod: AuthMethodType;

  @Column({ type: 'varchar', length: 50 })
  purpose: string; // 'registration', 'login', 'password_reset', 'phone_verification'

  @Column({ type: 'boolean', default: false })
  isUsed: boolean;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any; // Дополнительные данные (например, для OAuth)

  @CreateDateColumn()
  createdAt: Date;
}
