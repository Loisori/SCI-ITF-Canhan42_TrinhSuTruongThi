import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProjectEntity } from './project.entity';
import { UserEntity } from '../../users/entities/user.entity';

export enum DisputeStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
  REFUNDED = 'refunded',
}

@Entity({ name: 'project_disputes' })
export class ProjectDisputeEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index()
  @Column({ name: 'project_id', type: 'int' })
  projectId: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({ name: 'evidence_url', type: 'text', nullable: true })
  evidenceUrl: string | null;

  @Index()
  @Column({
    type: 'enum',
    enum: DisputeStatus,
    default: DisputeStatus.OPEN,
  })
  status: DisputeStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
