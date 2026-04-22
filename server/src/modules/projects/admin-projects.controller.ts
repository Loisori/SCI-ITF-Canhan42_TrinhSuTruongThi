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
import { ProjectStatus } from './entities/project.entity';
import { GetUser } from '../../common/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/projects')
export class AdminProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('funding-review')
  getFundedReview() {
    return this.projectsService.getProjectsByStatus(
      ProjectStatus.PENDING_ADMIN_REVIEW,
    );
  }

  @Get('pending')
  getPendingProjects() {
    return this.projectsService.getProjectsByStatus(ProjectStatus.PENDING);
  }

  @Patch(':id/approve-disbursement')
  approveDisbursement(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.approveFundedProject(id);
  }

  @Get('milestones/disputed')
  getDisputedMilestones() {
    return this.projectsService.getDisputedMilestones();
  }

  @Get('milestones/pending')
  getPendingMilestones() {
    return this.projectsService.getPendingMilestones();
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

  @Patch(':id/milestones/:mId/reject')
  rejectMilestone(
    @Param('id', ParseIntPipe) id: number,
    @Param('mId', ParseIntPipe) mId: number,
    @Body('reason') reason: string,
  ) {
    return this.projectsService.rejectMilestone(id, mId, reason);
  }

  @Post(':id/disputes/resolve')
  resolveDisputes(
    @Param('id', ParseIntPipe) id: number,
    @Body('action') action: 'dismiss' | 'refund',
  ) {
    return this.projectsService.resolveDisputes(id, action);
  }

  @Post('milestones/:mId/feedback')
  adminMilestoneFeedback(
    @Param('mId', ParseIntPipe) mId: number,
    @Body('content') content: string,
    @GetUser('id') adminId: number,
  ) {
    return this.projectsService.adminMilestoneFeedback(mId, adminId, content);
  }

  @Post('milestones/:mId/reset-vote')
  adminResetMilestoneVote(@Param('mId', ParseIntPipe) mId: number) {
    return this.projectsService.adminResetMilestoneVote(mId);
  }

  @Post('milestones/:mId/simulate-time')
  simulateMilestoneTime(@Param('mId', ParseIntPipe) mId: number) {
    return this.projectsService.simulateMilestoneTime(mId);
  }

  @Post(':id/terminate')
  adminTerminateProject(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string,
    @GetUser('id') adminId: number,
  ) {
    return this.projectsService.adminTerminateProject(id, adminId, reason);
  }
}
