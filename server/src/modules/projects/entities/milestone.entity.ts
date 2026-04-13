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
  VOTING = 'voting',
  ADMIN_REVIEW = 'admin_review',
  DISBURSED = 'disbursed',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  DISPUTED = 'disputed',
}

@Entity({ name: 'project_milestones' })
export class ProjectMilestoneEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })  
  id: number;

  @Column({ name: 'project_id', type: 'bigint', unsigned: true })
  projectId: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string | null;

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

  @Column({ name: 'evidence_urls', type: 'simple-json', nullable: true })
  evidenceUrls: string[] | null;

  @Column({ name: 'disbursement_date', type: 'timestamp', nullable: true })
  disbursementDate: Date | null;

  @Column({ name: 'voting_ends_at', type: 'timestamp', nullable: true })
  votingEndsAt: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ name: 'interval_days', type: 'int', default: 0 })
  intervalDays: number;

  @Column({ name: 'next_disbursement_date', type: 'timestamp', nullable: true })
  nextDisbursementDate: Date | null;


  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;
}
