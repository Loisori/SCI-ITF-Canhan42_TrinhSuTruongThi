import { Controller, Get } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('project-categories')
export class ProjectCategoriesController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  getProjectCategories() {
    return this.projectsService.getProjectCategories();
  }
}
