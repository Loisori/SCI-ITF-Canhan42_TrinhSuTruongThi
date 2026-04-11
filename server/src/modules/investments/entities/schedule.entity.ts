import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { InvestmentEntity } from './investment.entity';

export enum PaymentScheduleStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

@Entity({ name: 'payment_schedules' })
export class PaymentScheduleEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'investment_id', type: 'bigint', unsigned: true })
  investmentId: number;

  @Index()
  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | null) => (value === null ? 0 : parseFloat(value)),
    },
  })
  amount: number;

  @Index()
  @Column({
    type: 'enum',
    enum: PaymentScheduleStatus,
    default: PaymentScheduleStatus.UNPAID,
  })
  status: PaymentScheduleStatus;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @ManyToOne(() => InvestmentEntity, (investment) => investment.paymentSchedules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'investment_id' })
  investment: InvestmentEntity;
}
