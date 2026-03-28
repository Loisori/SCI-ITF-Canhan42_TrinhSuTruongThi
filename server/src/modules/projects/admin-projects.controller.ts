import {
  Controller,
  Get,
  Patch,
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
@Controller('api/admin/projects')
export class AdminProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('pending')
  getPendingProjects() {
    return this.projectsService.getPendingProjects();
  }

  @Patch(':id/approve')
  approveProject(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.approveProject(id);
  }

  @Patch(':id/reject')
  rejectProject(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.rejectProject(id);
  }
}
