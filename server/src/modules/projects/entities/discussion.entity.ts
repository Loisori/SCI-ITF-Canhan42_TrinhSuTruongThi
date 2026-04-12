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

@Entity({ name: 'milestone_discussions' })
export class MilestoneDiscussionEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'milestone_id', type: 'int', unsigned: true })
  milestoneId: number;

  @Column({ name: 'sender_id', type: 'bigint', unsigned: true })
  senderId: number;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => ProjectMilestoneEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'milestone_id' })
  milestone: ProjectMilestoneEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender: UserEntity;
}
