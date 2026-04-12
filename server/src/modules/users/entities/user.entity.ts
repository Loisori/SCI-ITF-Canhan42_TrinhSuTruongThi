import { Exclude } from 'class-transformer';
import {
  Entity,
  Column,
  PrimaryColumn,
  Generated,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  OneToOne,
} from 'typeorm';
import { ProjectCategoryEntity } from '../../projects/entities/category.entity';
import { ProjectEntity } from '../../projects/entities/project.entity';
import { InvestmentEntity } from '../../investments/entities/investment.entity';
import { TransactionEntity } from '../../transactions/entities/transaction.entity';
import { UserMediaEntity } from './user-media.entity';
import { KycEntity } from './kyc.entity';


// Cập nhật Enum để hỗ trợ 3 nhóm người dùng chính
export enum UserRole {
  INVESTOR = 'investor', // Người bỏ vốn
  OWNER = 'owner',       // Người huy động vốn (Chủ dự án)
  ADMIN = 'admin',       // Quản trị viên hệ thống
}

@Entity({ name: 'users' })
export class UserEntity {
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

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Exclude()
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

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ name: 'cover_photo_url', type: 'varchar', length: 255, nullable: true })
  coverPhotoUrl: string | null;

  @Column({
    name: 'social_links',
    type: 'json',
    nullable: true,
  })
  socialLinks: {
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    github?: string;
  } | null;

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

  @ManyToMany(() => ProjectCategoryEntity)
  @JoinTable({
    name: 'user_favorite_categories',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  favoriteCategories: ProjectCategoryEntity[];

  @ManyToMany(() => ProjectCategoryEntity)
  @JoinTable({
    name: 'user_blacklist_categories',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  blacklistCategories: ProjectCategoryEntity[];

  @OneToMany(() => UserMediaEntity, (media) => media.user)
  media: UserMediaEntity[];

  @OneToOne(() => KycEntity, (kyc) => kyc.user)
  kyc: KycEntity;


  @Column({
    name: 'notification_settings',
    type: 'json',
    nullable: true,
    select: false, // Ngăn chặn TypeORM tự động fetch cột này, tránh lỗi Unknown column khi login
  })
  notificationSettings: Record<string, boolean> = {
    email: true,
    push: true,
    investment_update: true,
    milestone_reached: true,
  };

  @Column({ name: 'is_frozen', type: 'boolean', default: false })
  isFrozen: boolean;
}

