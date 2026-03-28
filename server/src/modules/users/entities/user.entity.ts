import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ProjectEntity } from '../../projects/entities/project.entity';
import { InvestmentEntity } from '../../investments/entities/investment.entity';
import { TransactionEntity } from '../../transactions/entities/transaction.entity';

// Cập nhật Enum để hỗ trợ 3 nhóm người dùng chính
export enum UserRole {
  INVESTOR = 'investor', // Người bỏ vốn
  OWNER = 'owner',       // Người huy động vốn (Chủ dự án)
  ADMIN = 'admin',       // Quản trị viên hệ thống
}

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false }) // select: false để không vô tình trả về pass khi query
  password: string;

  @Column({ name: 'full_name', type: 'varchar', length: 100 })
  fullName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.INVESTOR,
  })
  role: UserRole;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  balance: number;

  @Column({ name: 'avatar_url', type: 'varchar', length: 255, nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    name: 'updated_at',
  })
  updatedAt: Date;

  @OneToMany(() => ProjectEntity, (project) => project.owner)
  ownedProjects: ProjectEntity[];

  @OneToMany(() => InvestmentEntity, (investment) => investment.user)
  investments: InvestmentEntity[];

  @OneToMany(() => TransactionEntity, (transaction) => transaction.user)
  transactions: TransactionEntity[];
}
