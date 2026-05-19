import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

type ProjectCategoryPayload = {
  name?: string;
  slug?: string;
  description?: string | null;
  iconUrl?: string | null;
};

@Controller('project-categories')
export class ProjectCategoriesController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  getProjectCategories() {
    return this.projectsService.getProjectCategories();
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/project-categories')
export class AdminProjectCategoriesController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  getProjectCategories() {
    return this.projectsService.getAdminProjectCategories();
  }

  @Post()
  createProjectCategory(@Body() payload: ProjectCategoryPayload) {
    return this.projectsService.createProjectCategory(payload);
  }

  @Patch(':id')
  updateProjectCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: ProjectCategoryPayload,
  ) {
    return this.projectsService.updateProjectCategory(id, payload);
  }

  @Delete(':id')
  deleteProjectCategory(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.deleteProjectCategory(id);
  }
}
