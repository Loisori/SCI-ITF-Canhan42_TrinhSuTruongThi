import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  Generated,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { ProjectCategoryEntity } from './category.entity';
import { ProjectMediaEntity } from './media.entity';
import { InvestmentEntity } from '../../investments/entities/investment.entity';
import { ProjectMilestoneEntity } from './milestone.entity';
import { ProjectDisputeEntity } from './dispute.entity';

export enum ProjectRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum ProjectStatus {
  PENDING = 'pending',
  FUNDING = 'funding',
  ACTIVE = 'active',
  PENDING_ADMIN_REVIEW = 'pending_admin_review',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  FAILED = 'failed',
}

@Entity({ name: 'projects' })
export class ProjectEntity {
  @PrimaryColumn({
    type: 'bigint',
    unsigned: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (value === null ? null : Number(value)),
    },
  })
  @Generated('increment')
  id: number;

  @Index()
  @Column({
    name: 'owner_id',
    type: 'bigint',
    unsigned: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (value === null ? null : Number(value)),
    },
  })
  ownerId: number;

  @Index()
  @Column({
    name: 'category_id',
    type: 'bigint',
    unsigned: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (value === null ? null : Number(value)),
    },
  })
  categoryId: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Index()
  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ name: 'short_description', type: 'text', nullable: true })
  shortDescription: string | null;

  @Column({ type: 'longtext', nullable: true })
  content: string | null;

  @Column({
    name: 'goal_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | null) => (value === null ? 0 : parseFloat(value)),
    },
  })
  goalAmount: number;

  @Column({
    name: 'current_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | null) => (value === null ? 0 : parseFloat(value)),
    },
  })
  currentAmount: number;

  @Column({
    name: 'min_investment',
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | null) => (value === null ? 0 : parseFloat(value)),
    },
  })
  minInvestment: number;

  @Column({
    name: 'interest_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | null) => (value === null ? 0 : parseFloat(value)),
    },
  })
  interestRate: number;

  // Commission rate (phí sàn) tính theo % (ví dụ 5.00 = 5%).
  // Cho phép nullable để tương thích dữ liệu cũ nếu cột mới chưa được gán.
  @Column({
    name: 'commission_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string | null) =>
        value === null ? null : parseFloat(value),
    },
  })
  commissionRate: number | null;

  @Column({ name: 'duration_months', type: 'int' })
  durationMonths: number;

  @Column({
    name: 'risk_level',
    type: 'enum',
    enum: ProjectRiskLevel,
    default: ProjectRiskLevel.MEDIUM,
  })
  riskLevel: ProjectRiskLevel;

  @Index()
  @Column({
    name: 'status',
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PENDING,
  })
  status: ProjectStatus;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date | null;

  @Index()
  @Column({ name: 'is_frozen', type: 'boolean', default: false })
  isFrozen: boolean;

  @Column({ name: 'allow_overfunding', type: 'boolean', default: false })
  allowOverfunding: boolean;

  @Column({
    name: 'total_debt',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | null) => (value === null ? 0 : parseFloat(value)),
    },
  })
  totalDebt: number;

  @Column({ name: 'owner_tier', type: 'int', default: 1 })
  ownerTier: number;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.ownedProjects, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'owner_id' })
  owner: UserEntity;

  @ManyToOne(() => ProjectCategoryEntity, (category) => category.projects)
  @JoinColumn({ name: 'category_id' })
  category: ProjectCategoryEntity;

  @OneToMany(() => ProjectMediaEntity, (media) => media.project)
  media: ProjectMediaEntity[];

  @OneToMany(() => InvestmentEntity, (investment) => investment.project)
  investments: InvestmentEntity[];

  @OneToMany(() => ProjectMilestoneEntity, (milestone) => milestone.project)
  milestones: ProjectMilestoneEntity[];

  @OneToMany(() => ProjectDisputeEntity, (dispute) => dispute.project)
  disputes: ProjectDisputeEntity[];
}
