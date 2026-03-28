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
import { ProjectEntity } from '../../projects/entities/project.entity';
import { PaymentScheduleEntity } from './schedule.entity';

export enum InvestmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  WITHDRAWN = 'withdrawn',
}

@Entity({ name: 'investments' })
export class InvestmentEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'project_id', type: 'int' })
  projectId: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  amount: number;

  @Column({
    type: 'enum',
    enum: InvestmentStatus,
    default: InvestmentStatus.ACTIVE,
  })
  status: InvestmentStatus;

  @CreateDateColumn({ name: 'invested_at', type: 'timestamp' })
  investedAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.investments)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => ProjectEntity, (project) => project.investments)
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @OneToMany(() => PaymentScheduleEntity, (schedule) => schedule.investment)
  paymentSchedules: PaymentScheduleEntity[];
}
