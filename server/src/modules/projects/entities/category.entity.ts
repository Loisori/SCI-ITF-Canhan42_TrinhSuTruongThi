import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  Generated,
} from 'typeorm';
import { ProjectEntity } from './project.entity';

@Entity({ name: 'project_categories' })
export class ProjectCategoryEntity {
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

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'icon_url', type: 'varchar', length: 255, nullable: true })
  iconUrl: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @OneToMany(() => ProjectEntity, (project) => project.category)
  projects: ProjectEntity[];
}
