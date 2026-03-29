import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {
  ProjectEntity,
  ProjectRiskLevel,
  ProjectStatus,
} from './entities/project.entity';
import { InvestProjectDto } from './dto/invest-project.dto';
import { UserEntity } from '../users/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectMediaEntity, MediaType } from './entities/media.entity';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectCategoryEntity } from './entities/category.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectsRepository: Repository<ProjectEntity>,
    @InjectRepository(ProjectMediaEntity)
    private readonly projectMediaRepository: Repository<ProjectMediaEntity>,
    @InjectRepository(ProjectCategoryEntity)
    private readonly projectCategoriesRepository: Repository<ProjectCategoryEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getProjectCategories() {
    const categories = await this.projectCategoriesRepository.find({
      select: ['id', 'name', 'slug'],
      order: { name: 'ASC' },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    }));
  }

  async getPendingProjects() {
    const projects = await this.projectsRepository.find({
      where: {
        status: ProjectStatus.PENDING,
      },
      relations: ['media', 'category', 'owner'],
      order: { createdAt: 'DESC' },
    });

    return projects.map((project) => this.serializeProject(project));
  }

  async approveProject(projectId: number) {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ['media', 'category', 'owner'],
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    if (project.status !== ProjectStatus.PENDING) {
      throw new BadRequestException('Only pending projects can be approved.');
    }

    project.status = ProjectStatus.FUNDING;
    await this.projectsRepository.save(project);

    await this.notifyProjectOwner(
      project.owner,
      'Dự án của bạn đã được duyệt! Dự án đã được mở để huy động vốn.',
    );

    return this.serializeProject(project);
  }

  async rejectProject(projectId: number) {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ['media', 'category', 'owner'],
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    if (project.status !== ProjectStatus.PENDING) {
      throw new BadRequestException('Only pending projects can be rejected.');
    }

    project.status = ProjectStatus.FAILED;
    await this.projectsRepository.save(project);

    await this.notifyProjectOwner(
      project.owner,
      'Dự án của bạn đã bị từ chối. Vui lòng kiểm tra lại thông tin và gửi lại nếu cần.',
    );

    return this.serializeProject(project);
  }

  private async notifyProjectOwner(owner: UserEntity, message: string) {
    if (!owner) {
      return;
    }

    // TODO: Replace this console log with a real persistent notification system.
    console.log(
      `Notification for owner ${owner.id} <${owner.email}>: ${message}`,
    );
  }

  async getFundingProjects(filters?: {
    search?: string;
    categoryId?: number;
  }) {
    const qb = this.projectsRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.media', 'media')
      .leftJoinAndSelect('project.category', 'category')
      .leftJoinAndSelect('project.owner', 'owner')
      .where('project.status = :status', { status: ProjectStatus.FUNDING });

    if (
      filters?.categoryId !== undefined &&
      filters.categoryId !== null &&
      !Number.isNaN(Number(filters.categoryId))
    ) {
      qb.andWhere('project.categoryId = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    if (filters?.search?.trim()) {
      const term = `%${filters.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(project.title) LIKE :term OR LOWER(owner.fullName) LIKE :term OR LOWER(category.name) LIKE :term)',
        { term },
      );
    }

    qb.orderBy('project.createdAt', 'DESC');

    const projects = await qb.getMany();
    return projects.map((project) => this.serializeProject(project));
  }

  async getFundingProjectSuggestions(query: string, limit = 12) {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    const qb = this.projectsRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.media', 'media')
      .leftJoinAndSelect('project.category', 'category')
      .leftJoinAndSelect('project.owner', 'owner')
      .where('project.status = :status', { status: ProjectStatus.FUNDING })
      .andWhere(
        '(LOWER(project.title) LIKE :term OR LOWER(owner.fullName) LIKE :term OR LOWER(category.name) LIKE :term)',
        { term: `%${trimmed.toLowerCase()}%` },
      )
      .orderBy('project.createdAt', 'DESC')
      .take(Math.min(Math.max(limit, 1), 30));

    const projects = await qb.getMany();
    return projects.map((project) => this.serializeProject(project));
  }

  async getProjectDetail(projectId: number) {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ['media', 'category'],
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const markdownContent = await this.readProjectMarkdown(project.slug);

    return {
      ...this.serializeProject(project),
      content: project.content ?? markdownContent,
    };
  }

  async getProjectDetailBySlug(slug: string) {
    const project = await this.projectsRepository.findOne({
      where: { slug },
      relations: ['media', 'category'],
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const markdownContent = await this.readProjectMarkdown(project.slug);

    return {
      ...this.serializeProject(project),
      content: project.content ?? markdownContent,
    };
  }

  async createProject(ownerId: number, dto: CreateProjectDto) {
    return this.dataSource.transaction(async (manager) => {
      const projectRepo = manager.getRepository(ProjectEntity);
      const mediaRepo = manager.getRepository(ProjectMediaEntity);
      const categoriesRepo = manager.getRepository(ProjectCategoryEntity);

      const category = await categoriesRepo.findOne({
        where: { id: dto.categoryId },
      });

      if (!category) {
        throw new BadRequestException('Danh mục dự án không hợp lệ.');
      }

      const project = projectRepo.create({
        ownerId,
        categoryId: dto.categoryId,
        title: dto.title,
        slug: dto.contentSlug,
        shortDescription: dto.shortDescription ?? null,
        content: null,
        goalAmount: dto.targetCapital,
        currentAmount: 0,
        minInvestment: dto.minInvestment,
        interestRate: dto.interestRate,
        durationMonths: dto.durationMonths,
        riskLevel: dto.riskLevel ?? ProjectRiskLevel.MEDIUM,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: dto.status ?? ProjectStatus.PENDING,
      });

      const created = await projectRepo.save(project);

      const additionalImages = (dto.additional_images ?? [])
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      const mediaRows: ProjectMediaEntity[] = [];

      if (dto.thumbnailUrl?.trim()) {
        mediaRows.push(
          mediaRepo.create({
            projectId: created.id,
            url: dto.thumbnailUrl.trim(),
            type: MediaType.IMAGE,
            isThumbnail: true,
            sortOrder: 0,
          }),
        );
      }

      additionalImages.forEach((url, index) => {
        mediaRows.push(
          mediaRepo.create({
            projectId: created.id,
            url,
            type: MediaType.IMAGE,
            isThumbnail: false,
            sortOrder: index + 1,
          }),
        );
      });

      if (mediaRows.length > 0) {
        await mediaRepo.save(mediaRows);
      }

      return this.getProjectDetailInTransaction(manager, created.id);
    });
  }

  async deleteProject(projectId: number) {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    await this.projectsRepository.remove(project);

    return {
      message: 'Project deleted successfully.',
      id: projectId,
    };
  }

  async updateProject(
    projectId: number,
    ownerId: number,
    dto: UpdateProjectDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const projectRepo = manager.getRepository(ProjectEntity);
      const mediaRepo = manager.getRepository(ProjectMediaEntity);
      const categoriesRepo = manager.getRepository(ProjectCategoryEntity);

      const project = await projectRepo.findOne({
        where: { id: projectId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!project) {
        throw new NotFoundException('Project not found.');
      }

      if (project.ownerId !== ownerId) {
        throw new ForbiddenException(
          'Bạn chỉ có thể chỉnh sửa dự án của chính mình.',
        );
      }

      if (dto.title !== undefined) {
        project.title = dto.title;
      }
      if (dto.shortDescription !== undefined) {
        project.shortDescription = dto.shortDescription;
      }
      if (dto.interestRate !== undefined) {
        project.interestRate = Number(dto.interestRate);
      }
      if (dto.durationMonths !== undefined) {
        project.durationMonths = Number(dto.durationMonths);
      }
      if (dto.targetCapital !== undefined) {
        project.goalAmount = Number(dto.targetCapital);
      }
      if (dto.categoryId !== undefined) {
        const category = await categoriesRepo.findOne({
          where: { id: Number(dto.categoryId) },
        });

        if (!category) {
          throw new BadRequestException('Danh mục dự án không hợp lệ.');
        }

        project.categoryId = Number(dto.categoryId);
      }
      if (dto.contentSlug !== undefined) {
        project.slug = dto.contentSlug;
      }

      await projectRepo.save(project);

      const hasGalleryPayload =
        dto.thumbnailUrl !== undefined || dto.additional_images !== undefined;

      if (hasGalleryPayload) {
        await mediaRepo.delete({ projectId: project.id });

        const mediaRows: ProjectMediaEntity[] = [];

        if (dto.thumbnailUrl?.trim()) {
          mediaRows.push(
            mediaRepo.create({
              projectId: project.id,
              url: dto.thumbnailUrl.trim(),
              type: MediaType.IMAGE,
              isThumbnail: true,
              sortOrder: 0,
            }),
          );
        }

        const additionalImages = (dto.additional_images ?? [])
          .map((url) => url.trim())
          .filter((url) => url.length > 0);

        additionalImages.forEach((url, index) => {
          mediaRows.push(
            mediaRepo.create({
              projectId: project.id,
              url,
              type: MediaType.IMAGE,
              isThumbnail: false,
              sortOrder: index + 1,
            }),
          );
        });

        if (mediaRows.length > 0) {
          await mediaRepo.save(mediaRows);
        }
      }

      return this.getProjectDetailInTransaction(manager, project.id);
    });
  }

  async stopFunding(projectId: number, ownerId: number) {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    if (project.ownerId !== ownerId) {
      throw new ForbiddenException('Bạn chỉ có thể dừng dự án của chính mình.');
    }

    if (project.status !== ProjectStatus.FUNDING) {
      throw new BadRequestException(
        'Dự án không ở trạng thái đang huy động vốn.',
      );
    }

    project.status = ProjectStatus.COMPLETED;
    await this.projectsRepository.save(project);

    return {
      message: 'Dự án đã dừng nhận vốn.',
      id: project.id,
      status: project.status,
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

      if (!project) {
        throw new NotFoundException('Project not found.');
      }

      if (project.status !== ProjectStatus.FUNDING) {
        throw new BadRequestException('Project is not accepting investments.');
      }

      const now = new Date();
      if (
        project.endDate &&
        new Date(project.endDate).getTime() < now.getTime()
      ) {
        throw new BadRequestException('Project funding deadline has passed.');
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
      const currentCapital = Number(project.currentAmount);

      if (amount > userBalance) {
        throw new BadRequestException('Insufficient balance.');
      }

      user.balance = userBalance - amount;
      project.currentAmount = currentCapital + amount;

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
    const targetCapital = Number(project.goalAmount);
    const currentCapital = Number(project.currentAmount);
    const fundingProgress =
      targetCapital > 0
        ? Number(((currentCapital / targetCapital) * 100).toFixed(2))
        : 0;

    const thumbnail =
      project.media?.find((media) => media.isThumbnail)?.url ??
      project.media?.[0]?.url ??
      null;

    const images = (project.media ?? [])
      .filter((media) => !media.isThumbnail)
      .map((media) => media.url);

    return {
      id: project.id,
      title: project.title,
      thumbnailUrl: thumbnail,
      shortDescription: project.shortDescription,
      contentSlug: project.slug,
      targetCapital,
      currentCapital,
      interestRate: Number(project.interestRate),
      durationMonths: project.durationMonths,
      minInvestment: Number(project.minInvestment),
      riskLevel: project.riskLevel,
      fundingProgress,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      category: project.category
        ? {
            id: project.category.id,
            name: project.category.name,
            slug: project.category.slug,
            iconUrl: project.category.iconUrl,
          }
        : null,
      owner: project.owner
        ? {
            id: project.owner.id,
            fullName: project.owner.fullName,
            email: project.owner.email,
          }
        : null,
      images,
      createdAt: project.createdAt,
    };
  }

  private async getProjectDetailInTransaction(
    manager: EntityManager,
    projectId: number,
  ) {
    const projectRepo = manager.getRepository(ProjectEntity);

    const project = await projectRepo.findOne({
      where: { id: projectId },
      relations: ['media', 'category'],
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const markdownContent = await this.readProjectMarkdown(project.slug);

    return {
      ...this.serializeProject(project),
      content: project.content ?? markdownContent,
    };
  }

  private async readProjectMarkdown(slug: string | null) {
    if (!slug) {
      return null;
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(slug)) {
      throw new BadRequestException('Invalid slug format.');
    }

    const fileName = `${slug}.md`;
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
