import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { ProjectEntity, ProjectStatus } from './project.entity';
import { InvestProjectDto } from './dto/invest-project.dto';
import { UserEntity } from '../users/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectsRepository: Repository<ProjectEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getFundingProjects() {
    const projects = await this.projectsRepository.find({
      where: {
        isPublished: true,
        status: ProjectStatus.FUNDING,
      },
      order: { createdAt: 'DESC' },
    });

    return projects.map((project) => this.serializeProject(project));
  }

  async getProjectDetail(projectId: number) {
    const project = await this.projectsRepository.findOne({ where: { id: projectId } });

    if (!project || !project.isPublished) {
      throw new NotFoundException('Project not found.');
    }

    const content = await this.readProjectMarkdown(project.contentSlug);

    return {
      ...this.serializeProject(project),
      content,
    };
  }

  async getProjectDetailBySlug(contentSlug: string) {
    const project = await this.projectsRepository.findOne({
      where: { contentSlug },
    });

    if (!project || !project.isPublished) {
      throw new NotFoundException('Project not found.');
    }

    const content = await this.readProjectMarkdown(project.contentSlug);

    return {
      ...this.serializeProject(project),
      content,
    };
  }

  async createProject(ownerId: number, dto: CreateProjectDto) {
    const project = this.projectsRepository.create({
      ownerId,
      title: dto.title,
      shortDescription: dto.shortDescription ?? null,
      thumbnailUrl: dto.thumbnailUrl ?? null,
      contentSlug: dto.contentSlug,
      targetCapital: dto.targetCapital,
      currentCapital: 0,
      interestRate: dto.interestRate,
      durationMonths: dto.durationMonths,
      isPublished: true,
      status: ProjectStatus.FUNDING,
    });

    const created = await this.projectsRepository.save(project);
    return this.serializeProject(created);
  }

  async deleteProject(projectId: number) {
    const project = await this.projectsRepository.findOne({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    await this.projectsRepository.remove(project);

    return {
      message: 'Project deleted successfully.',
      id: projectId,
    };
  }

  async invest(userId: number, dto: InvestProjectDto) {
    return this.dataSource.transaction(async (manager) => {
      const projectsRepo = manager.getRepository(ProjectEntity);
      const usersRepo = manager.getRepository(UserEntity);

      const project = await projectsRepo.findOne({
        where: { id: dto.projectId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!project || !project.isPublished) {
        throw new NotFoundException('Project not found.');
      }

      if (project.status !== ProjectStatus.FUNDING) {
        throw new BadRequestException('Project is not accepting investments.');
      }

      const user = await usersRepo.findOne({
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException('User not found.');
      }

      const amount = Number(dto.amount);
      const userBalance = Number(user.balance);
      const targetCapital = Number(project.targetCapital);
      const currentCapital = Number(project.currentCapital);
      const remainingCapital = Math.max(targetCapital - currentCapital, 0);

      if (amount > userBalance) {
        throw new BadRequestException('Insufficient balance.');
      }

      if (amount > remainingCapital) {
        throw new BadRequestException(
          `Investment exceeds remaining capital (${remainingCapital}).`,
        );
      }

      user.balance = userBalance - amount;
      project.currentCapital = currentCapital + amount;

      if (project.currentCapital >= targetCapital) {
        project.status = ProjectStatus.FUNDED;
      }

      await usersRepo.save(user);
      await projectsRepo.save(project);

      return {
        message: 'Investment successful.',
        investedAmount: amount,
        userBalance: user.balance,
        project: this.serializeProject(project),
      };
    });
  }

  private serializeProject(project: ProjectEntity) {
    const targetCapital = Number(project.targetCapital);
    const currentCapital = Number(project.currentCapital);
    const fundingProgress =
      targetCapital > 0
        ? Number(((currentCapital / targetCapital) * 100).toFixed(2))
        : 0;

    return {
      id: project.id,
      title: project.title,
      thumbnailUrl: project.thumbnailUrl,
      shortDescription: project.shortDescription,
      contentSlug: project.contentSlug,
      ownerId: project.ownerId,
      targetCapital,
      currentCapital,
      interestRate: Number(project.interestRate),
      durationMonths: project.durationMonths,
      fundingProgress,
      status: project.status,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  private async readProjectMarkdown(contentSlug: string | null) {
    if (!contentSlug) {
      return null;
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(contentSlug)) {
      throw new BadRequestException('Invalid content_slug format.');
    }

    const fileName = `${contentSlug}.md`;
    const candidatePaths = [
      path.join(process.cwd(), 'content', 'projects', fileName),
      path.join(process.cwd(), '..', 'content', 'projects', fileName),
      path.join(process.cwd(), 'server', 'content', 'projects', fileName),
    ];

    for (const filePath of candidatePaths) {
      try {
        await fs.access(filePath);
        return await fs.readFile(filePath, 'utf-8');
      } catch {
        // thử path tiếp theo
      }
    }

    return null;
  }
}
