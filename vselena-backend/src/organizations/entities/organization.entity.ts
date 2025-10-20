import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { Team } from '../../teams/entities/team.entity';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../rbac/entities/role.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'jsonb', default: '{}' })
  settings: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Team, (team) => team.organization)
  teams: Team[];

  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @ManyToMany(() => User, (user) => user.organizations)
  @JoinTable({
    name: 'user_organizations',
    joinColumn: { name: 'organization_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  members: User[];

  @OneToMany(() => Role, (role) => role.organization)
  roles: Role[];

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdBy' })
  creator: User | null;
}
