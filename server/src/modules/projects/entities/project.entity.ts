import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { ProjectCategoryEntity } from './category.entity';
import { ProjectMediaEntity } from './media.entity';
import { InvestmentEntity } from '../../investments/entities/investment.entity';

export enum ProjectRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum ProjectStatus {
  PENDING = 'pending',
  FUNDING = 'funding',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity({ name: 'projects' })
export class ProjectEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'owner_id', type: 'int' })
  ownerId: number;

  @Column({ name: 'category_id', type: 'int' })
  categoryId: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

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
      from: (value: string) => parseFloat(value),
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
      from: (value: string) => parseFloat(value),
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
      from: (value: string) => parseFloat(value),
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
      from: (value: string) => parseFloat(value),
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
      from: (value: string) => parseFloat(value),
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
}
