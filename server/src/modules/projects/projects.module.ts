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
import { MilestoneVoteEntity } from './entities/vote.entity';
import { MilestoneDiscussionEntity } from './entities/discussion.entity';
import { AdminProjectsController } from './admin-projects.controller';
import { TasksService } from './tasks.service';
import { MilestonesService } from './milestones.service';
import { VotingService } from './voting.service';

import { NotificationsModule } from '../notifications/notifications.module';
import { InvestmentsModule } from '../investments/investments.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectEntity,
      ProjectCategoryEntity,
      ProjectMediaEntity,
      ProjectMilestoneEntity,
      ProjectDisputeEntity,
      MilestoneVoteEntity,
      MilestoneDiscussionEntity,
    ]),

    AuthModule,
    UsersModule,
    NotificationsModule,
    InvestmentsModule,
  ],
  controllers: [
    ProjectsController,
    ProjectCategoriesController,
    AdminProjectsController,
  ],
  providers: [ProjectsService, TasksService, MilestonesService, VotingService],
  exports: [ProjectsService, MilestonesService, VotingService],
})
export class ProjectsModule {}
