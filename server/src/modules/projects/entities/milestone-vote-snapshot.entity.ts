import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProjectMilestoneEntity } from './milestone.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity({ name: 'milestone_vote_snapshots' })
@Index('idx_milestone_vote_snapshot_unique', ['milestoneId', 'userId'], {
  unique: true,
})
export class MilestoneVoteSnapshotEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'milestone_id', type: 'int', unsigned: true })
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

  @Column({
    name: 'capital_snapshot',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | null) => (value === null ? 0 : parseFloat(value)),
    },
  })
  capitalSnapshot: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => ProjectMilestoneEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'milestone_id' })
  milestone: ProjectMilestoneEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
