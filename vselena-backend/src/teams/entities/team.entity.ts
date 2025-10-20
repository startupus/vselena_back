import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../rbac/entities/role.entity';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  organizationId: string | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Organization, (organization) => organization.teams, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization | null;

  @OneToMany(() => User, (user) => user.team)
  users: User[];

  @ManyToMany(() => User, (user) => user.teams)
  @JoinTable({
    name: 'user_teams',
    joinColumn: { name: 'team_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  members: User[];

  @OneToMany(() => Role, (role) => role.team)
  roles: Role[];

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdBy' })
  creator: User | null;
}
