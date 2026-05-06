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

@Entity({ name: 'project_comments' })
export class ProjectCommentEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Index()
  @Column({ name: 'project_id', type: 'bigint', unsigned: true })
  projectId: number;

  @Index()
  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: number;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
