import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { InvestmentsService } from '../investments/investments.service';
import { InvestProjectDto } from './dto/invest-project.dto';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { IsOwnerGuard } from '../../common/guards/is-owner.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { IsInvestorGuard } from '../../common/guards/is-investor.guard';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../../common/guards/optional-auth.guard';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly investmentsService: InvestmentsService,
  ) {}

  @UseGuards(OptionalAuthGuard)
  @Get()
  getFundingProjects(
    @GetUser('id') userId: number | undefined,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    let categoryId: number | undefined;
    if (category !== undefined && category !== '') {
      const parsed = parseInt(category, 10);
      if (!Number.isNaN(parsed)) {
        categoryId = parsed;
      }
    }
    return this.projectsService.getFundingProjects({
      search: search?.trim() || undefined,
      categoryId,
      userId,
    });
  }

  @Get('suggestions')
  getProjectSearchSuggestions(@Query('q') q?: string) {
    return this.projectsService.getFundingProjectSuggestions(q ?? '', 12);
  }

  @Get('slug/:slug')
  getProjectDetailBySlug(@Param('slug') slug: string) {
    return this.projectsService.getProjectDetailBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, IsOwnerGuard)
  @Get('owner')
  getOwnerProjects(
    @GetUser('id') ownerId: number,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const normalizedPage = page ? Number(page) : 1;
    const normalizedPageSize = pageSize ? Number(pageSize) : 10;

    return this.projectsService.getOwnerProjects(
      ownerId,
      Number.isFinite(normalizedPage) ? normalizedPage : 1,
      Number.isFinite(normalizedPageSize) ? normalizedPageSize : 10,
    );
  }
  
  @Get('user/:userId/created')
  getUserCreatedProjects(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const normalizedPage = page ? Number(page) : 1;
    const normalizedPageSize = pageSize ? Number(pageSize) : 10;
    return this.projectsService.getOwnerProjects(userId, normalizedPage, normalizedPageSize);
  }

  @Get('user/:userId/invested')
  getUserInvestedProjects(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.investmentsService.getPublicInvestedProjects(userId);
  }

  @Get(':id')
  getProjectDetail(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.getProjectDetail(id);
  }

  @UseGuards(JwtAuthGuard, IsOwnerGuard)
  @Post()
  createProject(
    @GetUser('id') ownerId: number,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.createProject(ownerId, dto);
  }

  @UseGuards(JwtAuthGuard, IsOwnerGuard)
  @Delete(':id')
  deleteProject(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.deleteProject(id);
  }

  @UseGuards(JwtAuthGuard, IsOwnerGuard)
  @Put(':id')
  updateProject(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') ownerId: number,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.updateProject(id, ownerId, dto);
  }

  @UseGuards(JwtAuthGuard, IsOwnerGuard)
  @Put(':id/stop-funding')
  stopFunding(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') ownerId: number,
  ) {
    return this.projectsService.stopFunding(id, ownerId);
  }

  @UseGuards(JwtAuthGuard, IsInvestorGuard)
  @Post('invest')
  investInProject(
    @GetUser('id') userId: number,
    @Body() dto: InvestProjectDto,
  ) {
    return this.projectsService.invest(userId, dto);
  }

  @UseGuards(JwtAuthGuard, IsOwnerGuard)
  @Patch(':id/milestones/:mId/proof')
  uploadMilestoneProof(
    @Param('id', ParseIntPipe) id: number,
    @Param('mId', ParseIntPipe) mId: number,
    @GetUser('id') ownerId: number,
    @Body('proofUrl') proofUrl: string,
  ) {
    if (!proofUrl) throw new BadRequestException('proofUrl is required');
    return this.projectsService.uploadMilestoneProof(id, mId, ownerId, proofUrl);
  }

  @UseGuards(JwtAuthGuard, IsInvestorGuard)
  @Post(':id/disputes')
  createDispute(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') userId: number,
    @Body('reason') reason: string,
    @Body('evidenceUrl') evidenceUrl?: string,
  ) {
    if (!reason) throw new BadRequestException('reason is required');
    return this.projectsService.createDispute(id, userId, reason, evidenceUrl);
  }

  @UseGuards(JwtAuthGuard, IsOwnerGuard)
  @Put(':id/milestones')
  createOrUpdateMilestones(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') ownerId: number,
    @Body() milestonesData: { title: string; percentage: number; stage: number }[],
  ) {
    return this.projectsService.createOrUpdateMilestones(id, ownerId, milestonesData);
  }
}

