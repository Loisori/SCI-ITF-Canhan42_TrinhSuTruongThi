import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { InvestProjectDto } from './dto/invest-project.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { IsOwnerGuard } from '../../common/guards/is-owner.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { IsInvestorGuard } from '../../common/guards/is-investor.guard';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('api/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  getFundingProjects() {
    return this.projectsService.getFundingProjects();
  }

  @Get('slug/:slug')
  getProjectDetailBySlug(@Param('slug') slug: string) {
    return this.projectsService.getProjectDetailBySlug(slug);
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

  @UseGuards(JwtAuthGuard, IsInvestorGuard)
  @Post('invest')
  investInProject(
    @GetUser('id') userId: number,
    @Body() dto: InvestProjectDto,
  ) {
    return this.projectsService.invest(userId, dto);
  }
}
