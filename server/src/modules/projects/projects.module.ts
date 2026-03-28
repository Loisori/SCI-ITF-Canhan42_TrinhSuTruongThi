import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller';
import { ProjectCategoriesController } from './project-categories.controller';
import { ProjectsService } from './projects.service';
import { ProjectEntity } from './entities/project.entity';
import { AuthModule } from '../auth/auth.module';
import { ProjectCategoryEntity } from './entities/category.entity';
import { ProjectMediaEntity } from './entities/media.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectEntity,
      ProjectCategoryEntity,
      ProjectMediaEntity,
    ]),
    AuthModule,
  ],
  controllers: [ProjectsController, ProjectCategoriesController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
