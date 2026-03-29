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
import {
  InvestmentEntity,
  InvestmentStatus,
} from '../investments/entities/investment.entity';
import {
  PaymentScheduleEntity,
  PaymentScheduleStatus,
} from '../investments/entities/schedule.entity';
import {
  TransactionEntity,
  TransactionStatus,
  TransactionType,
} from '../transactions/entities/transaction.entity';
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

  private toCommissionFraction(commissionRate?: number | null): number {
    const raw = Number(commissionRate ?? 0);
    if (!Number.isFinite(raw) || raw <= 0) return 0;
    // Tự động suy luận:
    // - nếu lưu dạng % (5 -> 5%) => fraction = 0.05
    // - nếu lưu dạng fraction (0.05) => fraction = 0.05
    return raw > 1 ? raw / 100 : raw;
  }

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

  async getOwnerProjects(
    ownerId: number,
    page = 1,
    pageSize = 10,
  ): Promise<{
    items: Array<
      any & {
        investorsCount: number;
        netAfterFeeEstimate: number;
      }
    >;
    page: number;
    pageSize: number;
    total: number;
  }> {
    const take = Math.max(1, Math.min(pageSize, 50));
    const skip = Math.max(0, page - 1) * take;

    const [projects, total] = await this.projectsRepository.findAndCount({
      where: { ownerId },
      relations: ['media', 'category', 'owner'],
      order: { createdAt: 'DESC' },
      take,
      skip,
    });

    const investmentsRepo = this.dataSource.getRepository(InvestmentEntity);

    const items = await Promise.all(
      projects.map(async (project) => {
        const investorsCountRaw = await investmentsRepo
          .createQueryBuilder('inv')
          .select('COUNT(DISTINCT inv.userId)', 'cnt')
          .where('inv.projectId = :pid', { pid: project.id })
          .andWhere('inv.status != :withdrawn', {
            withdrawn: InvestmentStatus.WITHDRAWN,
          })
          .getRawOne<{ cnt: string }>();

        const investorsCount = Number(investorsCountRaw?.cnt ?? 0);

        const currentCapital = Number(project.currentAmount);
        const commissionFraction = this.toCommissionFraction(
          project.commissionRate,
        );
        const netAfterFeeEstimate = currentCapital * (1 - commissionFraction);

        return {
          ...this.serializeProject(project),
          investorsCount,
          netAfterFeeEstimate: Number(netAfterFeeEstimate.toFixed(2)),
        };
      }),
    );

    return { items, page, pageSize: take, total };
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
    return this.dataSource.transaction(async (manager) => {
      const projectsRepo = manager.getRepository(ProjectEntity);
      const investmentsRepo = manager.getRepository(InvestmentEntity);
      const usersRepo = manager.getRepository(UserEntity);
      const transactionsRepo = manager.getRepository(TransactionEntity);

      const project = await projectsRepo.findOne({
        where: { id: projectId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!project) {
        throw new NotFoundException('Project not found.');
      }

      if (project.ownerId !== ownerId) {
        throw new ForbiddenException(
          'Bạn chỉ có thể dừng dự án của chính mình.',
        );
      }

      if (project.status !== ProjectStatus.FUNDING) {
        throw new BadRequestException(
          'Dự án không ở trạng thái đang huy động vốn.',
        );
      }

      // Lấy tất cả investments của dự án (trừ withdrawn) để tính phí & trả lãi.
      const projectInvestments = await investmentsRepo.find({
        where: { projectId },
        relations: ['paymentSchedules'],
        lock: { mode: 'pessimistic_write' },
      });

      const interestSourceInvestments = projectInvestments.filter(
        (inv) => inv.status !== InvestmentStatus.WITHDRAWN,
      );

      const totalInvested = interestSourceInvestments.reduce(
        (sum, inv) => sum + Number(inv.amount),
        0,
      );

      const commissionFraction = this.toCommissionFraction(
        project.commissionRate,
      );
      const commissionAmount = Number(
        (totalInvested * commissionFraction).toFixed(2),
      );
      const netReceived = Number((totalInvested - commissionAmount).toFixed(2));

      for (const inv of projectInvestments) {
        if (inv.status === InvestmentStatus.ACTIVE) {
          inv.status = InvestmentStatus.COMPLETED;
        }
      }
      if (projectInvestments.length > 0) {
        await investmentsRepo.save(projectInvestments);
      }

      project.status = ProjectStatus.COMPLETED;
      await projectsRepo.save(project);

      // Credit owner net sau khi trừ phí sàn.
      const owner = await usersRepo.findOne({
        where: { id: ownerId },
        lock: { mode: 'pessimistic_write' },
      });
      if (owner) {
        owner.balance = Number(owner.balance) + netReceived;
        await usersRepo.save(owner);

        const ownerTx = transactionsRepo.create({
          userId: ownerId,
          amount: netReceived,
          type: TransactionType.WITHDRAW,
          status: TransactionStatus.SUCCESS,
          description: `Nhận vốn dự án ${project.title} (sau phí sàn)`,
          referenceId: project.id,
        });
        await transactionsRepo.save(ownerTx);
      }

      // Trả lãi (ROI) cho từng Investor: tạo transactions + cập nhật payment_schedules.
      const schedulesRepo = manager.getRepository(PaymentScheduleEntity);
      const now = new Date();
      const interestByInvestor = new Map<number, number>();
      const schedulesToUpdate: PaymentScheduleEntity[] = [];

      for (const inv of interestSourceInvestments) {
        const unpaid = (inv.paymentSchedules ?? []).filter(
          (s) => s.status === PaymentScheduleStatus.UNPAID,
        );
        const totalInterest = unpaid.reduce(
          (sum, s) => sum + Number(s.amount),
          0,
        );

        if (totalInterest > 0) {
          interestByInvestor.set(
            inv.userId,
            (interestByInvestor.get(inv.userId) ?? 0) + totalInterest,
          );
        }

        for (const s of unpaid) {
          s.status = PaymentScheduleStatus.PAID;
          s.paidAt = now;
          schedulesToUpdate.push(s);
        }
      }

      if (schedulesToUpdate.length > 0) {
        await schedulesRepo.save(schedulesToUpdate);
      }

      for (const [investorId, totalInterest] of interestByInvestor.entries()) {
        if (totalInterest <= 0) continue;

        const investor = await usersRepo.findOne({
          where: { id: investorId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!investor) continue;

        investor.balance = Number(investor.balance) + totalInterest;
        await usersRepo.save(investor);

        const interestTx = transactionsRepo.create({
          userId: investorId,
          amount: totalInterest,
          type: TransactionType.INTEREST_RECEIVE,
          status: TransactionStatus.SUCCESS,
          description: `Nhận lãi dự án ${project.title}`,
          referenceId: project.id,
        });
        await transactionsRepo.save(interestTx);
      }

      return {
        message: 'Dự án đã dừng nhận vốn.',
        id: project.id,
        status: project.status,
        commissionFraction,
        commissionAmount,
        netReceived,
      };
    });
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
