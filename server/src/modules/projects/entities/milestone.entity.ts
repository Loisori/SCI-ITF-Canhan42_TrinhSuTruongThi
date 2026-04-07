import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProjectEntity } from './project.entity';

export enum MilestoneStatus {
  PENDING = 'pending',
  UPLOADING_PROOF = 'uploading_proof',
  ADMIN_REVIEW = 'admin_review',
  DISBURSED = 'disbursed',
}

@Entity({ name: 'project_milestones' })
export class ProjectMilestoneEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'project_id', type: 'bigint', unsigned: true })
  projectId: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({
    type: 'int',
    transformer: {
      to: (value: number) => value,
      from: (value: string | null) => (value === null ? 0 : parseFloat(value)),
    },
  })
  percentage: number;

  @Column({ type: 'int' })
  stage: number;

  @Column({
    type: 'enum',
    enum: MilestoneStatus,
    default: MilestoneStatus.PENDING,
  })
  status: MilestoneStatus;

  @Column({ name: 'proof_url', type: 'text', nullable: true })
  proofUrl: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;
}
