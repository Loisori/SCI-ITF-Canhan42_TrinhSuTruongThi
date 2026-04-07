import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

export enum NotificationType {
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  INVESTMENT_RECEIVED = 'INVESTMENT_RECEIVED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  SYSTEM = 'SYSTEM',
}

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;
 
  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: number;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM,
  })
  type: NotificationType;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
