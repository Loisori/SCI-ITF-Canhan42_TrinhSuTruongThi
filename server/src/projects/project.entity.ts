import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectStatus {
  FUNDING = 'funding',
  FUNDED = 'funded',
  CLOSED = 'closed',
}

@Entity({ name: 'projects' })
export class ProjectEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'owner_id', type: 'int', nullable: true })
  ownerId: number | null;

  @Column({ name: 'thumbnail_url', type: 'varchar', length: 255, nullable: true })
  thumbnailUrl: string | null;

  @Column({ name: 'short_description', type: 'text', nullable: true })
  shortDescription: string | null;

  @Column({ name: 'content_slug', type: 'varchar', length: 255, nullable: true })
  contentSlug: string | null;

  @Column({ name: 'target_capital', type: 'decimal', precision: 15, scale: 2, default: 0 })
  targetCapital: number;

  @Column({ name: 'current_capital', type: 'decimal', precision: 15, scale: 2, default: 0 })
  currentCapital: number;

  @Column({ name: 'interest_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  interestRate: number;

  @Column({ name: 'duration_months', type: 'int', default: 1 })
  durationMonths: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.FUNDING,
  })
  status: ProjectStatus;

  @Column({ name: 'is_published', type: 'boolean', default: true })
  isPublished: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
