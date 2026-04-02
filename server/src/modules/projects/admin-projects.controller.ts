import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/projects')
export class AdminProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('pending')
  getPendingProjects() {
    return this.projectsService.getPendingProjects();
  }

  @Get('disputes')
  getFrozenProjects() {
    return this.projectsService.getFrozenProjects();
  }

  @Patch(':id/approve')
  approveProject(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.approveProject(id);
  }

  @Patch(':id/reject')
  rejectProject(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.rejectProject(id);
  }

  @Post(':id/milestones/:mId/finalize')
  finalizeMilestone(
    @Param('id', ParseIntPipe) id: number,
    @Param('mId', ParseIntPipe) mId: number,
  ) {
    return this.projectsService.finalizeMilestone(id, mId);
  }

  @Post(':id/disputes/resolve')
  resolveDisputes(
    @Param('id', ParseIntPipe) id: number,
    @Body('action') action: 'dismiss' | 'refund',
  ) {
    return this.projectsService.resolveDisputes(id, action);
  }
}

