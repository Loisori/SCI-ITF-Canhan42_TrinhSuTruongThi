import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false }) // select: false để không vô tình trả về pass khi query
  password: string;

  @Column({ type: 'varchar', length: 255 })
  fullName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.INVESTOR,
  })
  role: UserRole;

  // Sử dụng 'decimal' cho tiền tệ để tránh lỗi làm tròn số của kiểu float/number
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value), // MySQL trả về decimal dưới dạng string, cần parse lại number
  }})
  balance: number;

@CreateDateColumn({ 
  type: 'timestamp',
  name: 'createdAt'
})
createdAt: Date;

@UpdateDateColumn({ 
  type: 'timestamp',
  name: 'updatedAt'
})
updatedAt: Date;
}