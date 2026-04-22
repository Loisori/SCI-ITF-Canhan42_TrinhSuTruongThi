import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProjectMilestoneEntity } from './milestone.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity({ name: 'milestone_votes' })
export class MilestoneVoteEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({
    name: 'milestone_id',
    type: 'int',
    unsigned: true,
  })
  milestoneId: number;

  @Column({
    name: 'user_id',
    type: 'bigint',
    unsigned: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (value === null ? null : Number(value)),
    },
  })
  userId: number;

  @Column({ name: 'is_approve', type: 'boolean' })
  isApprove: boolean;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({
    name: 'investor_capital',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | null) => (value === null ? 0 : parseFloat(value)),
    },
  })
  investorCapital: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => ProjectMilestoneEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'milestone_id' })
  milestone: ProjectMilestoneEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
