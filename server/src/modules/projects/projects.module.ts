import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller';
import { ProjectCategoriesController } from './project-categories.controller';
import { ProjectsService } from './projects.service';
import { ProjectEntity } from './entities/project.entity';
import { AuthModule } from '../auth/auth.module';
import { ProjectCategoryEntity } from './entities/category.entity';
import { ProjectMediaEntity } from './entities/media.entity';
import { ProjectMilestoneEntity } from './entities/milestone.entity';
import { ProjectDisputeEntity } from './entities/dispute.entity';
import { AdminProjectsController } from './admin-projects.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectEntity,
      ProjectCategoryEntity,
      ProjectMediaEntity,
      ProjectMilestoneEntity,
      ProjectDisputeEntity,
    ]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [
    ProjectsController,
    ProjectCategoriesController,
    AdminProjectsController,
  ],
  providers: [ProjectsService],
})
export class ProjectsModule {}
