import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';

export enum BlogStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

@Entity({ name: 'blogs' })
export class BlogEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  slug: string;

  @Column({ type: 'longtext' })
  content: string;

  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl: string | null;

  @Index()
  @Column({ name: 'author_id', type: 'bigint', unsigned: true })
  authorId: number;

  @Index()
  @Column({ type: 'varchar', length: 120 })
  category: string;

  @Index()
  @Column({ type: 'enum', enum: BlogStatus, default: BlogStatus.DRAFT })
  status: BlogStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: UserEntity;
}
