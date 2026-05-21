import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository, Not, IsNull } from 'typeorm';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {
  ProjectEntity,
  ProjectRiskLevel,
  ProjectStatus,
} from './entities/project.entity';
import { InvestProjectDto } from './dto/invest-project.dto';
import { UserEntity, UserRole } from '../users/entities/user.entity';
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
import {
  ProjectMilestoneEntity,
  MilestoneStatus,
} from './entities/milestone.entity';
import { MilestoneVoteEntity } from './entities/vote.entity';
import { MilestoneDiscussionEntity } from './entities/discussion.entity';
import { ProjectDisputeEntity, DisputeStatus } from './entities/dispute.entity';
import { ProjectCommentEntity } from './entities/comment.entity';
import { KycStatus } from '../users/entities/kyc.entity';
import { FinancialCalculator } from '../../common/utils/financial-calculator';
import { MilestonesService } from './milestones.service';
import { VotingService } from './voting.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { UsersService } from '../users/users.service';
import { InvestmentsService } from '../investments/investments.service';

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
    private readonly usersService: UsersService,
    private readonly milestonesService: MilestonesService,
    private readonly votingService: VotingService,
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationsService: NotificationsService,
    private readonly investmentsService: InvestmentsService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.backfillSlugs();
  }

  private async backfillSlugs() {
    const allProjects = await this.projectsRepository.find({
      select: ['id', 'title', 'slug'],
    });

    const projectsToUpdate = allProjects.filter(
      (p) => !p.slug || /^\d+$/.test(p.slug),
    );

    if (projectsToUpdate.length > 0) {
      console.log(
        `[ProjectsService] Backfilling slugs for ${projectsToUpdate.length} projects...`,
      );
      for (const project of projectsToUpdate) {
        project.slug = await this.generateUniqueSlug(project.title);
        await this.projectsRepository.save(project);
      }
      console.log(`[ProjectsService] Backfill complete.`);
    }
  }

  async getHomepageStats() {
    const investmentRepo = this.dataSource.getRepository(InvestmentEntity);
    const userRepo = this.dataSource.getRepository(UserEntity);

    const [activeProjects, investors, avgReturnRaw, capitalRaw] =
      await Promise.all([
        this.projectsRepository.count({
          where: { status: ProjectStatus.FUNDING },
        }),
        userRepo.count({ where: { role: UserRole.INVESTOR } }),
        this.projectsRepository
          .createQueryBuilder('project')
          .select('COALESCE(AVG(project.interestRate), 0)', 'avg')
          .where('project.status IN (:...statuses)', {
            statuses: [ProjectStatus.FUNDING, ProjectStatus.COMPLETED],
          })
          .getRawOne<{ avg: string }>(),
        investmentRepo
          .createQueryBuilder('investment')
          .select('COALESCE(SUM(investment.amount), 0)', 'sum')
          .where('investment.status != :withdrawn', {
            withdrawn: InvestmentStatus.WITHDRAWN,
          })
          .getRawOne<{ sum: string }>(),
      ]);

    return {
      totalCapitalRaised: Math.round(Number(capitalRaw?.sum ?? 0)),
      activeProjects: Math.round(activeProjects),
      investors: Math.round(investors),
      averageReturnRate: Math.round(Number(avgReturnRaw?.avg ?? 0)),
    };
  }

  private generateRawSlug(title: string): string {
    return title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = this.generateRawSlug(title) || 'project';
    let slug = baseSlug;
    let counter = 1;

    // We use projectsRepository directly to check for collisions
    while (await this.projectsRepository.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }

  private toCommissionFraction(commissionRate?: number | null): number {
    return FinancialCalculator.toCommissionFraction(commissionRate);
  }

  private async finalizeGoalReached(
    manager: EntityManager,
    project: ProjectEntity,
  ): Promise<void> {
    const projectsRepo = manager.getRepository(ProjectEntity);
    const milestonesRepo = manager.getRepository(ProjectMilestoneEntity);
    const transactionsRepo = manager.getRepository(TransactionEntity);
    const usersRepo = manager.getRepository(UserEntity);

    project.status = ProjectStatus.PENDING_ADMIN_REVIEW;
    project.totalDebt = FinancialCalculator.calculateTotalDebt(
      Number(project.currentAmount),
      project.interestRate,
      project.durationMonths,
      project.commissionRate,
    );
    await projectsRepo.save(project);

    const upfrontFee = FinancialCalculator.calculateCommission(
      Number(project.currentAmount),
      project.commissionRate,
    );

    if (upfrontFee > 0) {
      const existingFeeTx = await transactionsRepo.findOne({
        where: {
          type: TransactionType.SYSTEM_FEE,
          referenceId: project.id,
          parentTransactionId: IsNull(),
          status: TransactionStatus.SUCCESS,
        },
      });

      if (!existingFeeTx) {
        const adminPlatformId = this.getAdminPlatformId();
        const adminUser = await usersRepo.findOne({
          where: { id: adminPlatformId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!adminUser) {
          throw new NotFoundException('Admin platform account not found');
        }

        await manager
          .createQueryBuilder()
          .update(UserEntity)
          .set({ balance: () => 'balance + :amount' })
          .where('id = :id')
          .setParameters({ id: adminPlatformId, amount: upfrontFee })
          .execute();

        const feeTx = transactionsRepo.create({
          userId: adminPlatformId,
          amount: upfrontFee,
          type: TransactionType.SYSTEM_FEE,
          status: TransactionStatus.SUCCESS,
          description: `Phí sàn dự án ${project.title} (kết thúc huy động)`,
          referenceId: project.id,
        });
        await transactionsRepo.save(feeTx);
      }
    }

    const stage1 = await milestonesRepo.findOne({
      where: { projectId: project.id, stage: 1 },
      lock: { mode: 'pessimistic_write' },
    });
    if (!stage1) {
      throw new BadRequestException(
        'Không tìm thấy thông tin giải ngân đợt 1.',
      );
    }
    stage1.status = MilestoneStatus.ADMIN_REVIEW;
    await milestonesRepo.save(stage1);
  }

  private getAdminPlatformId(): number {
    const raw = this.configService.get<string>('ADMIN_PLATFORM_ID');
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new BadRequestException('ADMIN_PLATFORM_ID is not configured.');
    }
    return parsed;
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

  async getAdminProjectCategories() {
    const rows = await this.projectCategoriesRepository
      .createQueryBuilder('category')
      .leftJoin('category.projects', 'project')
      .select('category.id', 'id')
      .addSelect('category.name', 'name')
      .addSelect('category.slug', 'slug')
      .addSelect('category.description', 'description')
      .addSelect('category.iconUrl', 'iconUrl')
      .addSelect('category.createdAt', 'createdAt')
      .addSelect('COUNT(project.id)', 'projectCount')
      .groupBy('category.id')
      .addGroupBy('category.name')
      .addGroupBy('category.slug')
      .addGroupBy('category.description')
      .addGroupBy('category.iconUrl')
      .addGroupBy('category.createdAt')
      .orderBy('category.name', 'ASC')
      .getRawMany<{
        id: string | number;
        name: string;
        slug: string;
        description: string | null;
        iconUrl: string | null;
        createdAt: Date;
        projectCount: string;
      }>();

    return rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      slug: row.slug,
      description: row.description,
      iconUrl: row.iconUrl,
      createdAt: row.createdAt,
      projectCount: Number(row.projectCount ?? 0),
    }));
  }

  async createProjectCategory(payload: {
    name?: string;
    slug?: string;
    description?: string | null;
    iconUrl?: string | null;
  }) {
    const name = payload.name?.trim();
    if (!name) {
      throw new BadRequestException('Tên danh mục là bắt buộc.');
    }

    const requestedSlug = payload.slug?.trim();
    const slug = await this.generateUniqueCategorySlug(requestedSlug || name);

    const category = this.projectCategoriesRepository.create({
      name,
      slug,
      description: payload.description?.trim() || null,
      iconUrl: payload.iconUrl?.trim() || null,
    });

    const saved = await this.projectCategoriesRepository.save(category);

    return {
      id: saved.id,
      name: saved.name,
      slug: saved.slug,
      description: saved.description,
      iconUrl: saved.iconUrl,
      createdAt: saved.createdAt,
      projectCount: 0,
    };
  }

  async updateProjectCategory(
    categoryId: number,
    payload: {
      name?: string;
      slug?: string;
      description?: string | null;
      iconUrl?: string | null;
    },
  ) {
    const category = await this.projectCategoriesRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    if (payload.name !== undefined) {
      const name = payload.name.trim();
      if (!name) {
        throw new BadRequestException('Tên danh mục là bắt buộc.');
      }
      category.name = name;
    }

    if (payload.slug !== undefined) {
      const slug = this.generateRawSlug(payload.slug);
      if (!slug) {
        throw new BadRequestException('Slug danh mục không hợp lệ.');
      }

      const existing = await this.projectCategoriesRepository.findOne({
        where: { slug },
      });
      if (existing && existing.id !== category.id) {
        throw new BadRequestException('Slug danh mục đã tồn tại.');
      }

      category.slug = slug;
    }

    if (payload.description !== undefined) {
      category.description = payload.description?.trim() || null;
    }

    if (payload.iconUrl !== undefined) {
      category.iconUrl = payload.iconUrl?.trim() || null;
    }

    const saved = await this.projectCategoriesRepository.save(category);
    await this.syncProjectsDataJsonFile();

    return {
      id: saved.id,
      name: saved.name,
      slug: saved.slug,
      description: saved.description,
      iconUrl: saved.iconUrl,
      createdAt: saved.createdAt,
    };
  }

  async deleteProjectCategory(categoryId: number) {
    const category = await this.projectCategoriesRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    const linkedProjects = await this.projectsRepository.count({
      where: { categoryId },
    });

    if (linkedProjects > 0) {
      throw new BadRequestException(
        'Không thể xóa danh mục đang có dự án sử dụng.',
      );
    }

    await this.projectCategoriesRepository.remove(category);

    return {
      message: 'Category deleted successfully.',
      id: categoryId,
    };
  }

  private async generateUniqueCategorySlug(value: string) {
    const baseSlug = this.generateRawSlug(value) || 'category';
    let slug = baseSlug;
    let counter = 1;

    while (await this.projectCategoriesRepository.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  async getProjectsByStatus(status: ProjectStatus) {
    const projects = await this.projectsRepository.find({
      where: { status },
      relations: ['media', 'category', 'owner'],
      order: { createdAt: 'DESC' },
    });
    return projects.map((project) => this.serializeProject(project));
  }

  async getAdminProjects(filters?: {
    search?: string;
    status?: ProjectStatus | 'all';
    page?: number;
    pageSize?: number;
  }) {
    const page =
      Number.isFinite(filters?.page) && Number(filters?.page) > 0
        ? Number(filters?.page)
        : 1;
    const pageSize =
      Number.isFinite(filters?.pageSize) && Number(filters?.pageSize) > 0
        ? Math.min(Number(filters?.pageSize), 100)
        : 20;

    const qb = this.projectsRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.media', 'media')
      .leftJoinAndSelect('project.category', 'category')
      .leftJoinAndSelect('project.owner', 'owner');

    if (filters?.status && filters.status !== 'all') {
      qb.where('project.status = :status', { status: filters.status });
    }

    if (filters?.search?.trim()) {
      const term = `%${filters.search.trim().toLowerCase()}%`;
      const condition =
        '(LOWER(project.title) LIKE :term OR LOWER(owner.fullName) LIKE :term OR LOWER(owner.email) LIKE :term OR LOWER(category.name) LIKE :term)';

      if (qb.expressionMap.wheres.length > 0) {
        qb.andWhere(condition, { term });
      } else {
        qb.where(condition, { term });
      }
    }

    const [projects, total] = await qb
      .orderBy('project.createdAt', 'DESC')
      .take(pageSize)
      .skip((page - 1) * pageSize)
      .getManyAndCount();

    return {
      items: projects.map((project) => this.serializeProject(project)),
      page,
      pageSize,
      total,
    };
  }

  async getOwnerProjects(
    ownerIdentifier: string | number,
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

    let ownerId: number;
    if (typeof ownerIdentifier === 'number') {
      ownerId = ownerIdentifier;
    } else {
      const user = await this.usersService.findByIdentifier(ownerIdentifier);
      if (!user) throw new NotFoundException('User not found');
      ownerId = user.id;
    }

    const [projects, total] = await this.projectsRepository.findAndCount({
      where: { ownerId },
      relations: ['media', 'category', 'owner', 'milestones', 'disputes'],
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
      relations: ['owner'],
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    if (project.status !== ProjectStatus.PENDING) {
      throw new BadRequestException('Only pending projects can be approved.');
    }

    await this.projectsRepository.update(projectId, {
      status: ProjectStatus.FUNDING,
    });

    project.status = ProjectStatus.FUNDING;
    await this.syncProjectsDataJsonFile();

    this.eventEmitter.emit('project.approved', {
      ownerId: project.ownerId,
      title: project.title,
    });

    return this.serializeProject(project);
  }

  async approveFundedProject(projectId: number) {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ['owner', 'milestones'],
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    if (project.status !== ProjectStatus.PENDING_ADMIN_REVIEW) {
      throw new BadRequestException(
        'Chỉ có thể giải ngân cho dự án đã huy động xong và đang chờ duyệt.',
      );
    }

    const stage1 = project.milestones.find((m) => m.stage === 1);
    if (!stage1) {
      throw new BadRequestException(
        'Không tìm thấy thông tin giải ngân đợt 1.',
      );
    }

    // Set project to ACTIVE
    const activationDate = new Date();
    await this.projectsRepository.update(projectId, {
      status: ProjectStatus.ACTIVE,
    });

    await this.investmentsService.generatePaymentSchedulesForProject(
      projectId,
      activationDate,
    );

    // Trigger disbursement for Milestone 1
    const result = await this.disburseMilestoneFunds(stage1.id);

    await this.syncProjectsDataJsonFile();

    this.eventEmitter.emit('project.activated', {
      ownerId: project.ownerId,
      title: project.title,
    });

    return result;
  }

  async rejectProject(projectId: number) {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ['owner'],
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    if (project.status !== ProjectStatus.PENDING) {
      throw new BadRequestException('Only pending projects can be rejected.');
    }

    await this.projectsRepository.update(projectId, {
      status: ProjectStatus.FAILED,
    });

    project.status = ProjectStatus.FAILED;
    await this.syncProjectsDataJsonFile();

    this.eventEmitter.emit('project.rejected', {
      ownerId: project.ownerId,
      title: project.title,
    });

    return this.serializeProject(project);
  }

  async simulateMilestoneTime(milestoneId: number) {
    const milestoneRepo = this.dataSource.getRepository(ProjectMilestoneEntity);
    const milestone = await milestoneRepo.findOne({
      where: { id: milestoneId },
      relations: ['project'],
    });

    if (!milestone) throw new NotFoundException('Milestone not found');

    const now = new Date();
    const pastDate = new Date(now.getTime() - 60000); // 1 minute ago

    if (milestone.status === MilestoneStatus.VOTING) {
      milestone.votingEndsAt = pastDate;
    } else if (milestone.status === MilestoneStatus.PENDING) {
      milestone.nextDisbursementDate = pastDate;
    }

    await milestoneRepo.save(milestone);

    if (milestone.status === MilestoneStatus.VOTING) {
      await this.votingService.processMilestoneFinalResult(milestone);
    }

    return { message: 'Thời gian đã được tua nhanh thành công.' };
  }

  async getFundingProjects(filters?: {
    search?: string;
    categoryId?: number;
    userId?: number;
  }) {
    const qb = this.projectsRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.media', 'media')
      .leftJoinAndSelect('project.category', 'category')
      .leftJoinAndSelect('project.owner', 'owner')
      .where('project.status = :status', { status: ProjectStatus.FUNDING });

    // Lọc bỏ các category trong blacklist của user nếu có userId
    if (filters?.userId) {
      const userRepo = this.dataSource.getRepository(UserEntity);
      const user = await userRepo.findOne({
        where: { id: filters.userId },
        relations: ['blacklistCategories'],
      });

      if (user && user.blacklistCategories.length > 0) {
        const blacklistedIds = user.blacklistCategories.map((c) => c.id);
        qb.andWhere('project.categoryId NOT IN (:...blacklistedIds)', {
          blacklistedIds,
        });
      }
    }

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

  async getProjectDetailByIdentifier(identifier: string) {
    // Check if it's a numeric ID
    const numericId = parseInt(identifier, 10);
    const isNumeric = /^\d+$/.test(identifier);

    const project = await this.projectsRepository.findOne({
      where: isNumeric ? { id: numericId } : { slug: identifier },
      relations: ['media', 'category', 'milestones', 'disputes', 'owner'],
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
    const createdProject = await this.dataSource.transaction(
      async (manager) => {
        const projectRepo = manager.getRepository(ProjectEntity);
        const mediaRepo = manager.getRepository(ProjectMediaEntity);
        const categoriesRepo = manager.getRepository(ProjectCategoryEntity);
        const userRepo = manager.getRepository(UserEntity);
        const category = await categoriesRepo.findOne({
          where: { id: dto.categoryId },
        });

        if (!category) {
          throw new BadRequestException('Danh mục dự án không hợp lệ.');
        }

        // Check KYC status
        const owner = await userRepo.findOne({
          where: { id: ownerId },
          relations: ['kyc'],
        });

        if (!owner?.kyc || owner.kyc.status !== KycStatus.APPROVED) {
          throw new ForbiddenException(
            'Tài khoản của bạn chưa hoàn tất xác thực danh tính (KYC). Vui lòng gửi yêu cầu và đợi Admin duyệt để tạo dự án.',
          );
        }

        const project = projectRepo.create({
          ownerId,
          categoryId: dto.categoryId,
          title: dto.title,
          slug: await this.generateUniqueSlug(dto.title),
          shortDescription: dto.shortDescription ?? null,
          content: dto.content ?? null,
          goalAmount: dto.targetCapital,
          currentAmount: 0,
          minInvestment: dto.minInvestment,
          interestRate: dto.interestRate,
          durationMonths: dto.durationMonths,
          riskLevel: dto.riskLevel ?? ProjectRiskLevel.MEDIUM,
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          allowOverfunding: !!dto.allowOverfunding,
          status: dto.status ?? ProjectStatus.PENDING,
          address: dto.address ?? null,
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

        // -- Milestone Logic --
        if (dto.milestones && dto.milestones.length > 0) {
          const milestoneRepo = manager.getRepository(ProjectMilestoneEntity);
          const totalPercentage = dto.milestones.reduce(
            (sum, m) => sum + Number(m.percentage),
            0,
          );
          if (totalPercentage !== 100) {
            throw new BadRequestException(
              'Tổng phần trăm giải ngân phải bằng 100%.',
            );
          }

          const milestoneEntities = dto.milestones.map((m) =>
            milestoneRepo.create({
              projectId: created.id,
              title: m.title,
              content: m.content,
              percentage: m.percentage,
              stage: m.stage,
              intervalDays: m.intervalDays ?? 0,
              status: MilestoneStatus.PENDING,
            }),
          );
          await milestoneRepo.save(milestoneEntities);
        }

        return this.getProjectDetailInTransaction(manager, created.id);
      },
    );

    await this.syncProjectsDataJsonFile();
    return createdProject;
  }

  async deleteProject(projectId: number) {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    await this.projectsRepository.remove(project);
    await this.syncProjectsDataJsonFile();

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
    const updatedProject = await this.dataSource.transaction(
      async (manager) => {
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
        // Note: Immutability enforced here. slug is NOT updated if it already exists.
        // If for some reason it's missing, we could generate it, but entity requires it.

        if (dto.shortDescription !== undefined) {
          project.shortDescription = dto.shortDescription;
        }
        if (dto.content !== undefined) {
          project.content = dto.content;
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

        if (dto.address !== undefined) {
          project.address = dto.address;
        }

        // Note: project.slug is never updated here to ensure immutability.

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
      },
    );

    await this.syncProjectsDataJsonFile();
    return updatedProject;
  }

  async stopFunding(projectId: number, ownerId: number) {
    const result = await this.dataSource.transaction(async (manager) => {
      const projectsRepo = manager.getRepository(ProjectEntity);
      const investmentsRepo = manager.getRepository(InvestmentEntity);

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

      const currentAmount = Number(project.currentAmount) || 0;
      const goalAmount = Number(project.goalAmount) || 0;
      if (goalAmount <= 0 || currentAmount < goalAmount) {
        throw new BadRequestException(
          'Chỉ có thể dừng huy động khi dự án đã đạt ít nhất 100% mục tiêu vốn.',
        );
      }

      // Lấy tất cả investments của dự án (trừ withdrawn).
      const projectInvestments = await investmentsRepo.find({
        where: { projectId },
        relations: ['paymentSchedules'],
        lock: { mode: 'pessimistic_write' },
      });

      if (this.toCommissionFraction(project.commissionRate) <= 0) {
        const ownerCompletedCount = await projectsRepo.count({
          where: { ownerId: project.ownerId, status: ProjectStatus.COMPLETED },
        });
        const fallbackFeeRate =
          ownerCompletedCount >= 3
            ? 0.05
            : ownerCompletedCount >= 1
              ? 0.08
              : 0.1;
        project.commissionRate = FinancialCalculator.round(
          fallbackFeeRate * 100,
        );
      }

      for (const inv of projectInvestments) {
        if (inv.status === InvestmentStatus.ACTIVE) {
          inv.status = InvestmentStatus.COMPLETED;
        }
      }
      if (projectInvestments.length > 0) {
        await investmentsRepo.save(projectInvestments);
      }

      await this.finalizeGoalReached(manager, project);

      return {
        message: 'Dự án đã dừng nhận vốn.',
        id: project.id,
        status: project.status,
      };
    });

    await this.syncProjectsDataJsonFile();
    return result;
  }

  async invest(userId: number, dto: InvestProjectDto) {
    return this.dataSource
      .transaction(async (manager) => {
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
          throw new BadRequestException(
            'Project is not accepting investments.',
          );
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
        const goalAmount = Number(project.goalAmount);

        if (amount > userBalance) {
          throw new BadRequestException('Số dư ví không đủ.');
        }

        // overfunding checked here
        if (!project.allowOverfunding && currentCapital + amount > goalAmount) {
          const remaining = goalAmount - currentCapital;
          throw new BadRequestException(
            remaining > 0
              ? `Dự án này không cho phép vượt mục tiêu. Bạn chỉ có thể đầu tư tối đa ${remaining.toLocaleString()} ₫.`
              : 'Dự án đã đạt mục tiêu huy động.',
          );
        }

        user.balance = userBalance - amount;
        project.currentAmount = currentCapital + amount;

        await usersRepo.save(user);
        const isGoalReached = project.currentAmount >= goalAmount;
        const shouldCloseFunding = isGoalReached && !project.allowOverfunding;

        if (shouldCloseFunding) {
          await this.finalizeGoalReached(manager, project);
        } else {
          await projectsRepo.save(project);
        }

        return {
          message: 'Investment successful.',
          investedAmount: amount,
          userBalance: user.balance,
          project: this.serializeProject(project),
          projectTitle: project.title,
          projectOwnerId: project.ownerId,
          isGoalReached,
        };
      })
      .then((result) => {
        // Notify owner OUTSIDE transaction
        this.eventEmitter.emit('investment.made', {
          ownerId: result.projectOwnerId,
          amount: result.investedAmount,
          title: result.projectTitle,
        });

        if (result.isGoalReached) {
          this.eventEmitter.emit('project.goalReached', {
            projectId: dto.projectId,
            title: result.projectTitle,
            ownerId: result.projectOwnerId,
          });
        }

        return result;
      });
  }

  private serializeProject(project: ProjectEntity) {
    const targetCapital = Number(project.goalAmount) || 0;
    const currentCapital = Number(project.currentAmount) || 0;
    const fundingProgress =
      targetCapital > 0
        ? Number(((currentCapital / targetCapital) * 100).toFixed(2)) || 0
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
      slug: project.slug,
      address: project.address,
      targetCapital,
      currentAmount: currentCapital,
      interestRate: Number(project.interestRate) || 0,
      durationMonths: project.durationMonths || 0,
      minInvestment: Number(project.minInvestment) || 0,
      riskLevel: project.riskLevel,
      fundingProgress,
      status: project.status,
      totalDebt: Number(project.totalDebt || 0),
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
            slug: project.owner.slug,
            fullName: project.owner.fullName,
            email: project.owner.email,
            avatarUrl: project.owner.avatarUrl,
            bio: project.owner.bio,
            socialLinks: project.owner.socialLinks,
            address: project.owner.address,
          }
        : null,
      images,
      isFrozen: project.isFrozen,
      createdAt: project.createdAt,
      milestones: project.milestones?.map((m) => ({
        id: m.id,
        title: m.title,
        content: m.content,
        percentage: m.percentage,
        stage: m.stage,
        status: m.status,
        evidenceUrls: m.evidenceUrls,
        disbursementDate: m.disbursementDate,
        votingEndsAt: m.votingEndsAt,
        intervalDays: m.intervalDays,
        nextDisbursementDate: m.nextDisbursementDate,
        createdAt: m.createdAt,
      })),
      disputes: project.disputes
        ? project.disputes.map((d) => ({
            id: d.id,
            userId: d.userId,
            reason: d.reason,
            evidenceUrl: d.evidenceUrl,
            status: d.status,
            createdAt: d.createdAt,
          }))
        : undefined,
    };
  }

  private async getProjectDetailInTransaction(
    manager: EntityManager,
    projectId: number,
  ) {
    const projectRepo = manager.getRepository(ProjectEntity);

    const project = await projectRepo.findOne({
      where: { id: projectId },
      relations: ['media', 'category', 'milestones'],
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

  private async syncProjectsDataJsonFile() {
    try {
      const projects = await this.projectsRepository.find({
        relations: ['media', 'category', 'owner', 'milestones', 'disputes'],
        order: { createdAt: 'DESC' },
      });

      const payload = projects.map((project) => ({
        ...this.serializeProject(project),
        content: project.content ?? null,
      }));

      const primaryPath = path.join(
        process.cwd(),
        'src',
        'data',
        'projects-data.json',
      );
      const fallbackPath = path.join(
        process.cwd(),
        'server',
        'src',
        'data',
        'projects-data.json',
      );

      const targetPath = primaryPath.includes('/server/')
        ? primaryPath
        : fallbackPath;

      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, JSON.stringify(payload, null, 2), 'utf8');
    } catch (error) {
      console.error(
        '[ProjectsService] Failed to sync projects-data.json:',
        error,
      );
    }
  }

  private async readProjectMarkdown(slug: string | null) {
    if (!slug) {
      return null;
    }

    // Allow alphanumeric, underscores, and hyphens
    if (!/^[a-zA-Z0-9_\-]+$/.test(slug)) {
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

  async createDispute(
    projectId: number,
    userId: number,
    reason: string,
    evidenceUrl?: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const projectRepo = manager.getRepository(ProjectEntity);
      const disputeRepo = manager.getRepository(ProjectDisputeEntity);
      const investRepo = manager.getRepository(InvestmentEntity);

      const project = await projectRepo.findOne({
        where: { id: projectId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!project) throw new NotFoundException('Project not found');

      // Check if user is an active investor
      const investment = await investRepo.findOne({
        where: { projectId, userId, status: InvestmentStatus.ACTIVE },
      });
      if (!investment && project.status !== ProjectStatus.COMPLETED) {
        // Even COMPLETED has active investments until fully matured? Wait, yes.
        const pastInvestment = await investRepo.findOne({
          where: { projectId, userId },
        });
        if (!pastInvestment)
          throw new ForbiddenException('Only investors can dispute');
      }

      // Create dispute
      const dispute = disputeRepo.create({
        projectId,
        userId,
        reason,
        evidenceUrl,
        status: DisputeStatus.OPEN,
      });
      await disputeRepo.save(dispute);

      // Check for auto-freeze
      const openDisputes = await disputeRepo.count({
        where: { projectId, status: DisputeStatus.OPEN },
      });

      const uniqueInvestorsRaw = await investRepo
        .createQueryBuilder('inv')
        .select('COUNT(DISTINCT inv.userId)', 'cnt')
        .where('inv.projectId = :pid', { pid: project.id })
        .andWhere('inv.status != :withdrawn', {
          withdrawn: InvestmentStatus.WITHDRAWN,
        })
        .getRawOne<{ cnt: string }>();

      const totalInvestors = Number(uniqueInvestorsRaw?.cnt ?? 0);

      // Freeze logic: 50%
      if (
        totalInvestors > 0 &&
        openDisputes > totalInvestors * 0.5 &&
        !project.isFrozen
      ) {
        project.isFrozen = true;
        await projectRepo.save(project);

        await this.notificationsService.createSpecialNotification(
          project.ownerId,
          `Dự án ${project.title} đang bị quá nhiều khiếu nại (đã bị đóng băng). Vui lòng cập nhật tiến độ sớm nhất!`,
          NotificationType.SYSTEM,
        );
      }

      return dispute;
    });
  }

  async getProjectComments(projectId: number) {
    const comments = await this.dataSource
      .getRepository(ProjectCommentEntity)
      .find({
        where: { projectId },
        relations: ['user'],
        order: { createdAt: 'ASC' },
      });

    return comments.map((comment) => ({
      id: comment.id,
      projectId: comment.projectId,
      userId: comment.userId,
      content: comment.content,
      createdAt: comment.createdAt,
      user: comment.user
        ? {
            id: comment.user.id,
            fullName: comment.user.fullName,
            email: comment.user.email,
            avatarUrl: comment.user.avatarUrl,
          }
        : null,
    }));
  }

  async createProjectComment(
    projectId: number,
    userId: number,
    content: string,
  ) {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      throw new BadRequestException('content is required');
    }

    return this.dataSource.transaction(async (manager) => {
      const projectRepo = manager.getRepository(ProjectEntity);
      const investRepo = manager.getRepository(InvestmentEntity);
      const commentRepo = manager.getRepository(ProjectCommentEntity);

      const project = await projectRepo.findOne({ where: { id: projectId } });
      if (!project) {
        throw new NotFoundException('Project not found');
      }

      const investment = await investRepo.findOne({
        where: { projectId, userId },
      });

      if (!investment || investment.status === InvestmentStatus.WITHDRAWN) {
        throw new ForbiddenException(
          'Only investors of this project can comment',
        );
      }

      const comment = commentRepo.create({
        projectId,
        userId,
        content: trimmedContent,
      });

      await commentRepo.save(comment);
      const comments = await commentRepo.find({
        where: { projectId },
        relations: ['user'],
        order: { createdAt: 'ASC' },
      });

      return comments.map((item) => ({
        id: item.id,
        projectId: item.projectId,
        userId: item.userId,
        content: item.content,
        createdAt: item.createdAt,
        user: item.user
          ? {
              id: item.user.id,
              fullName: item.user.fullName,
              email: item.user.email,
              avatarUrl: item.user.avatarUrl,
            }
          : null,
      }));
    });
  }

  async finalizeMilestone(projectId: number, milestoneId: number) {
    const disbursementData = await this.dataSource.transaction(
      async (manager) => {
        const milestoneRepo = manager.getRepository(ProjectMilestoneEntity);
        const projectRepo = manager.getRepository(ProjectEntity);
        const transactionRepo = manager.getRepository(TransactionEntity);
        const usersRepo = manager.getRepository(UserEntity);
        const investmentsRepo = manager.getRepository(InvestmentEntity);

        const milestone = await milestoneRepo.findOne({
          where: { id: milestoneId, projectId },
        });
        if (!milestone) throw new NotFoundException('Milestone not found');
        if (milestone.status !== MilestoneStatus.ADMIN_REVIEW)
          throw new BadRequestException('Milestone not ready for review');

        const project = await projectRepo.findOne({ where: { id: projectId } });
        if (!project) throw new NotFoundException('Project not found');

        // Milestone 1 must be disbursed via approveFundedProject (Activation)
        if (
          milestone.stage === 1 &&
          project.status === ProjectStatus.PENDING_ADMIN_REVIEW
        ) {
          throw new BadRequestException(
            'Giai đoạn 1 không thể bắt đầu bình chọn. Vui lòng duyệt kích hoạt dự án để giải ngân đợt 1.',
          );
        }

        milestone.status = MilestoneStatus.VOTING;
        const votingDays = 3;
        const endsAt = new Date();
        endsAt.setDate(endsAt.getDate() + votingDays);
        milestone.votingEndsAt = endsAt;

        await milestoneRepo.save(milestone);

        await this.votingService.buildVotingSnapshot(
          manager,
          milestone.id,
          milestone.projectId,
        );

        // Trigger voting started event so that VotingService and Investors are aware
        this.eventEmitter.emit('milestone.voting_started', {
          projectId: milestone.projectId,
          milestoneId: milestone.id,
          title: milestone.title,
        });

        return {
          milestone,
          ownerId: project.ownerId,
          projectTitle: project.title,
          stage: milestone.stage,
        };
      },
    );

    // Notify Owner that Admin has approved proof
    await this.notificationsService.createSpecialNotification(
      disbursementData.ownerId,
      `Bằng chứng giải ngân Giai đoạn ${disbursementData.stage} của dự án ${disbursementData.projectTitle} đã được Admin phê duyệt hợp lệ. Quá trình Bình chọn (Voting) 72h đã chính thức bắt đầu!`,
      NotificationType.SYSTEM,
    );

    await this.syncProjectsDataJsonFile();
    return disbursementData.milestone;
  }

  async resolveDisputes(projectId: number, action: 'dismiss' | 'refund') {
    const resolutionData = await this.dataSource.transaction(
      async (manager) => {
        const projectRepo = manager.getRepository(ProjectEntity);
        const disputeRepo = manager.getRepository(ProjectDisputeEntity);
        const transactionRepo = manager.getRepository(TransactionEntity);
        const usersRepo = manager.getRepository(UserEntity);
        const investmentsRepo = manager.getRepository(InvestmentEntity);
        const milestoneRepo = manager.getRepository(ProjectMilestoneEntity);

        const project = await projectRepo.findOne({
          where: { id: projectId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!project) throw new NotFoundException('Project not found');
        if (!project.isFrozen)
          throw new BadRequestException('Project is not frozen');

        if (action === 'dismiss') {
          project.isFrozen = false;
          await projectRepo.save(project);

          await disputeRepo.update(
            { projectId, status: DisputeStatus.OPEN },
            { status: DisputeStatus.RESOLVED },
          );

          return {
            action,
            ownerId: project.ownerId,
            projectTitle: project.title,
            message: 'Disputes dismissed, project unfrozen.',
          };
        } else if (action === 'refund') {
          project.status = ProjectStatus.FAILED;
          await projectRepo.save(project);

          await disputeRepo.update(
            { projectId, status: DisputeStatus.OPEN },
            { status: DisputeStatus.REFUNDED },
          );

          // Calculate remaining undisbursed funds
          const milestones = await milestoneRepo.find({ where: { projectId } });
          const disbursedPercentages = milestones
            .filter((m) => m.status === MilestoneStatus.DISBURSED)
            .reduce((sum, m) => sum + m.percentage, 0);

          const remainingPercentage = 100 - disbursedPercentages;

          const projectInvestments = await investmentsRepo.find({
            where: { projectId: project.id, status: InvestmentStatus.ACTIVE },
            lock: { mode: 'pessimistic_write' },
          });

          // Refund investors remaining percentage of their initial investment
          for (const inv of projectInvestments) {
            const invUser = await usersRepo.findOne({
              where: { id: inv.userId },
              lock: { mode: 'pessimistic_write' },
            });
            if (!invUser) continue;

            const refundAmount = Number(
              (Number(inv.amount) * (remainingPercentage / 100)).toFixed(2),
            );
            if (refundAmount > 0) {
              invUser.balance = Number(invUser.balance) + refundAmount;
              await usersRepo.save(invUser);

              const refundTx = transactionRepo.create({
                userId: inv.userId,
                amount: refundAmount,
                type: TransactionType.REFUND,
                status: TransactionStatus.SUCCESS,
                description: `Hoàn tiền dư phần còn lại dự án ${project.title} do vi phạm tiến độ`,
                referenceId: project.id,
              });
              await transactionRepo.save(refundTx);
            }
          }

          // Penalize Owner
          const owner = await usersRepo.findOne({
            where: { id: project.ownerId },
            lock: { mode: 'pessimistic_write' },
          });
          if (owner) {
            owner.balance = 0;
            await usersRepo.save(owner);
          }

          return {
            action,
            ownerId: project.ownerId,
            projectTitle: project.title,
            message:
              'Project cancelled, remaining funds refunded, owner penalized.',
          };
        }
        throw new BadRequestException('Invalid action');
      },
    );

    // Notify outside transaction
    if (resolutionData.action === 'dismiss') {
      await this.notificationsService.createSpecialNotification(
        resolutionData.ownerId,
        `Tranh chấp dự án ${resolutionData.projectTitle} đã được giải quyết. Bạn có thể tiếp tục.`,
        NotificationType.SYSTEM,
      );
    } else if (resolutionData.action === 'refund') {
      await this.notificationsService.createSpecialNotification(
        resolutionData.ownerId,
        `Dự án ${resolutionData.projectTitle} đã bị hủy do khiếu nại. Hệ thống tiến hành thu hồi số dư của bạn.`,
        NotificationType.SYSTEM,
      );
    }

    await this.syncProjectsDataJsonFile();
    return { message: resolutionData.message };
  }

  async getFrozenProjects() {
    const projects = await this.projectsRepository.find({
      where: { isFrozen: true, status: ProjectStatus.COMPLETED }, // or FUNDING depending on when they reach milestone Phase
      relations: ['disputes', 'disputes.user'],
      order: { createdAt: 'DESC' },
    });

    return projects.map((p) => ({
      ...this.serializeProject(p),
      disputes: p.disputes.map((d) => ({
        id: d.id,
        reason: d.reason,
        evidenceUrl: d.evidenceUrl,
        status: d.status,
        user: d.user
          ? {
              id: d.user.id,
              fullName: d.user.fullName,
              email: d.user.email,
            }
          : null,
      })),
    }));
  }

  async uploadMilestoneProof(
    projectId: number,
    milestoneId: number,
    ownerId: number,
    evidenceUrls: string[],
  ) {
    const milestone = await this.milestonesService.uploadMilestoneProof(
      projectId,
      milestoneId,
      ownerId,
      evidenceUrls,
    );
    await this.syncProjectsDataJsonFile();
    return milestone;
  }

  async rejectMilestone(
    projectId: number,
    milestoneId: number,
    reason: string,
  ) {
    const milestoneRepo = this.dataSource.getRepository(ProjectMilestoneEntity);
    const projectRepo = this.dataSource.getRepository(ProjectEntity);

    const milestone = await milestoneRepo.findOne({
      where: { id: milestoneId, projectId },
    });
    if (!milestone) throw new NotFoundException('Milestone not found');
    if (milestone.status !== MilestoneStatus.ADMIN_REVIEW)
      throw new BadRequestException('Milestone is not in review stage');

    const project = await projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    milestone.status = MilestoneStatus.UPLOADING_PROOF;
    milestone.rejectionReason = reason;
    return this.milestonesService.rejectMilestone(
      projectId,
      milestoneId,
      reason,
    );
  }

  async getDisputedMilestones() {
    return this.milestonesService.getDisputedMilestones();
  }

  async getPendingMilestones() {
    return this.milestonesService.getPendingMilestones();
  }

  async createOrUpdateMilestones(
    projectId: number,
    ownerId: number,
    milestonesData: { title: string; percentage: number; stage: number }[],
  ) {
    return this.milestonesService.createOrUpdateMilestones(
      projectId,
      ownerId,
      milestonesData,
    );
  }

  async startMilestoneVoting(milestoneId: number, ownerId: number) {
    return this.votingService.startMilestoneVoting(milestoneId, ownerId);
  }

  async submitVote(
    userId: number,
    milestoneId: number,
    isApprove: boolean,
    comment?: string,
  ) {
    return this.votingService.submitVote(
      userId,
      milestoneId,
      isApprove,
      comment,
    );
  }

  async closeExpiredVotes() {
    return this.votingService.closeExpiredVotes();
  }

  async disburseMilestoneFunds(milestoneId: number) {
    const milestone = await this.dataSource
      .getRepository(ProjectMilestoneEntity)
      .findOneBy({ id: milestoneId });
    if (!milestone) throw new NotFoundException('Milestone not found');
    return this.milestonesService.disburseMilestoneFunds(
      milestone.projectId,
      milestoneId,
    );
  }

  // --- Admin Mediation ---

  async adminMilestoneFeedback(
    milestoneId: number,
    adminId: number,
    content: string,
  ) {
    return this.milestonesService.adminMilestoneFeedback(
      milestoneId,
      adminId,
      content,
    );
  }

  async adminResetMilestoneVote(milestoneId: number) {
    return this.votingService.adminResetMilestoneVote(milestoneId);
  }

  async adminTerminateProject(
    projectId: number,
    adminId: number,
    reason: string,
  ) {
    return this.milestonesService.adminTerminateProject(
      projectId,
      adminId,
      reason,
    );
  }

  async ownerMilestoneResponse(
    milestoneId: number,
    ownerId: number,
    content: string,
  ) {
    return this.milestonesService.ownerMilestoneResponse(
      milestoneId,
      ownerId,
      content,
    );
  }

  async getMilestoneDiscussions(milestoneId: number) {
    return this.milestonesService.getMilestoneDiscussions(milestoneId);
  }

  async getMilestoneVotes(milestoneId: number) {
    return this.votingService.getMilestoneVotes(milestoneId);
  }
}
