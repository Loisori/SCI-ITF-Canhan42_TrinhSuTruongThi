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
import { ProjectMilestoneEntity, MilestoneStatus } from './entities/milestone.entity';
import { ProjectDisputeEntity, DisputeStatus } from './entities/dispute.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

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
    private readonly notificationsService: NotificationsService,
  ) {}

  private toCommissionFraction(commissionRate?: number | null): number {
    const raw = Number(commissionRate || 0);
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
      relations: ['owner'],
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    if (project.status !== ProjectStatus.PENDING) {
      throw new BadRequestException('Only pending projects can be approved.');
    }

    await this.projectsRepository.update(projectId, { 
      status: ProjectStatus.FUNDING 
    });

    project.status = ProjectStatus.FUNDING;
    await this.syncProjectsDataJsonFile();
    await this.notifyProjectOwner(
      project.owner,
      'Dự án của bạn đã được duyệt! Dự án đã được mở để huy động vốn.',
    );

    return this.serializeProject(project);
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
      status: ProjectStatus.FAILED 
    });

    project.status = ProjectStatus.FAILED;
    
    await this.syncProjectsDataJsonFile();
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

  async getProjectDetail(projectId: number) {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
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

  async getProjectDetailBySlug(slug: string) {
    const project = await this.projectsRepository.findOne({
      where: { slug },
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
    const createdProject = await this.dataSource.transaction(async (manager) => {
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
        content: dto.content ?? null,
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
    const updatedProject = await this.dataSource.transaction(async (manager) => {
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

    await this.syncProjectsDataJsonFile();
    return updatedProject;
  }

  async stopFunding(projectId: number, ownerId: number) {
    const result = await this.dataSource.transaction(async (manager) => {
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

      // Create 5 milestones
      const milestonesRepo = manager.getRepository(ProjectMilestoneEntity);
      const milestones: ProjectMilestoneEntity[] = [];
      for (let i = 1; i <= 5; i++) {
        let status = MilestoneStatus.PENDING;
        if (i === 1) status = MilestoneStatus.DISBURSED;
        else if (i === 2) status = MilestoneStatus.UPLOADING_PROOF;

        milestones.push(milestonesRepo.create({
          projectId: project.id,
          title: `Giai đoạn ${i} (20%)`,
          percentage: 20,
          stage: i,
          status
        }));
      }
      await milestonesRepo.save(milestones);

      const firstDisbursement = Number((netReceived * 0.2).toFixed(2));

      // Credit owner first milestone (20%)
      const owner = await usersRepo.findOne({
        where: { id: ownerId },
        lock: { mode: 'pessimistic_write' },
      });
      if (owner && firstDisbursement > 0) {
        owner.balance = Number(owner.balance) + firstDisbursement;
        await usersRepo.save(owner);

        const ownerTx = transactionsRepo.create({
          userId: ownerId,
          amount: firstDisbursement,
          type: TransactionType.DISBURSEMENT,
          status: TransactionStatus.SUCCESS,
          description: `Nhận vốn đợt 1 dự án ${project.title}`,
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

        // Notify investor about interest paid
        await this.notificationsService.createSpecialNotification(
          investorId,
          `Tiền lãi ${totalInterest.toLocaleString('vi-VN')} ₫ từ dự án ${project.title} đã về ví.`,
          NotificationType.PAYMENT_SUCCESS
        );
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

    await this.syncProjectsDataJsonFile();
    return result;
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

      // Notify owner
      await this.notificationsService.createSpecialNotification(
        project.ownerId,
        `Có người vừa đầu tư ${amount.toLocaleString('vi-VN')} ₫ vào dự án ${project.title} của bạn.`,
        NotificationType.INVESTMENT_RECEIVED
      );

      // Check if project reached 100%
      if (currentCapital + amount >= Number(project.goalAmount)) {
        const investmentsRepo = manager.getRepository(InvestmentEntity);
        const investors = await investmentsRepo.find({
          where: { projectId: project.id },
          select: ['userId']
        });
        const uniqueInvestorIds = [...new Set(investors.map(i => i.userId))];
        for (const iId of uniqueInvestorIds) {
          await this.notificationsService.createSpecialNotification(
            iId,
            `Dự án bạn theo dõi (${project.title}) đã đạt 100% mục tiêu!`,
            NotificationType.PROJECT_UPDATE
          );
        }
      }

      return {
        message: 'Investment successful.',
        investedAmount: amount,
        userBalance: user.balance,
        project: this.serializeProject(project),
      };
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
      contentSlug: project.slug,
      targetCapital,
      currentAmount: currentCapital, // legacy field name sync
      currentCapital,
      interestRate: Number(project.interestRate) || 0,
      durationMonths: project.durationMonths || 0,
      minInvestment: Number(project.minInvestment) || 0,
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
            avatarUrl: project.owner.avatarUrl,
            bio: project.owner.bio,
            socialLinks: project.owner.socialLinks,
          }
        : null,
      images,
      isFrozen: project.isFrozen,
      createdAt: project.createdAt,
      milestones: project.milestones ? project.milestones.map(m => ({
        id: m.id,
        title: m.title,
        percentage: m.percentage,
        stage: m.stage,
        status: m.status,
        proofUrl: m.proofUrl,
        createdAt: m.createdAt,
      })) : undefined,
      disputes: project.disputes ? project.disputes.map(d => ({
        id: d.id,
        userId: d.userId,
        reason: d.reason,
        evidenceUrl: d.evidenceUrl,
        status: d.status,
        createdAt: d.createdAt,
      })) : undefined,
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

  async uploadMilestoneProof(projectId: number, milestoneId: number, ownerId: number, proofUrl: string) {
    const project = await this.projectsRepository.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== ownerId) throw new ForbiddenException('Only owner can upload proof');

    const milestoneRepo = this.dataSource.getRepository(ProjectMilestoneEntity);
    const milestone = await milestoneRepo.findOne({ where: { id: milestoneId, projectId } });
    if (!milestone) throw new NotFoundException('Milestone not found');

    if (milestone.status !== MilestoneStatus.UPLOADING_PROOF) {
      throw new BadRequestException('Not the right time to upload proof for this milestone');
    }

    milestone.proofUrl = proofUrl;
    milestone.status = MilestoneStatus.ADMIN_REVIEW;
    await milestoneRepo.save(milestone);

    return milestone;
  }

  async createDispute(projectId: number, userId: number, reason: string, evidenceUrl?: string) {
    return this.dataSource.transaction(async (manager) => {
      const projectRepo = manager.getRepository(ProjectEntity);
      const disputeRepo = manager.getRepository(ProjectDisputeEntity);
      const investRepo = manager.getRepository(InvestmentEntity);

      const project = await projectRepo.findOne({
        where: { id: projectId },
        lock: { mode: 'pessimistic_write' }
      });

      if (!project) throw new NotFoundException('Project not found');

      // Check if user is an active investor
      const investment = await investRepo.findOne({
        where: { projectId, userId, status: InvestmentStatus.ACTIVE }
      });
      if (!investment && project.status !== ProjectStatus.COMPLETED) { // Even COMPLETED has active investments until fully matured? Wait, yes.
        const pastInvestment = await investRepo.findOne({ where: { projectId, userId } });
        if (!pastInvestment) throw new ForbiddenException('Only investors can dispute');
      }

      // Create dispute
      const dispute = disputeRepo.create({
        projectId,
        userId,
        reason,
        evidenceUrl,
        status: DisputeStatus.OPEN
      });
      await disputeRepo.save(dispute);

      // Check for auto-freeze
      const openDisputes = await disputeRepo.count({
        where: { projectId, status: DisputeStatus.OPEN }
      });

      const uniqueInvestorsRaw = await investRepo
        .createQueryBuilder('inv')
        .select('COUNT(DISTINCT inv.userId)', 'cnt')
        .where('inv.projectId = :pid', { pid: project.id })
        .andWhere('inv.status != :withdrawn', { withdrawn: InvestmentStatus.WITHDRAWN })
        .getRawOne<{ cnt: string }>();
        
      const totalInvestors = Number(uniqueInvestorsRaw?.cnt ?? 0);

      // Freeze logic: 50%
      if (totalInvestors > 0 && openDisputes > totalInvestors * 0.5 && !project.isFrozen) {
        project.isFrozen = true;
        await projectRepo.save(project);

        await this.notificationsService.createSpecialNotification(
          project.ownerId,
          `Dự án ${project.title} đang bị quá nhiều khiếu nại (đã bị đóng băng). Vui lòng cập nhật tiến độ sớm nhất!`,
          NotificationType.SYSTEM
        );
      }

      return dispute;
    });
  }

  async finalizeMilestone(projectId: number, milestoneId: number) {
    const result = await this.dataSource.transaction(async (manager) => {
      const milestoneRepo = manager.getRepository(ProjectMilestoneEntity);
      const projectRepo = manager.getRepository(ProjectEntity);
      const transactionRepo = manager.getRepository(TransactionEntity);
      const usersRepo = manager.getRepository(UserEntity);
      const investmentsRepo = manager.getRepository(InvestmentEntity);

      const milestone = await milestoneRepo.findOne({ where: { id: milestoneId, projectId } });
      if (!milestone) throw new NotFoundException('Milestone not found');
      if (milestone.status !== MilestoneStatus.ADMIN_REVIEW) throw new BadRequestException('Milestone not ready for review');

      const project = await projectRepo.findOne({ where: { id: projectId } });
      if (!project) throw new NotFoundException('Project not found');

      const projectInvestments = await investmentsRepo.find({
        where: { projectId: project.id },
      });
      const interestSourceInvestments = projectInvestments.filter(
        (inv) => inv.status !== InvestmentStatus.WITHDRAWN,
      );
      const totalInvested = interestSourceInvestments.reduce((sum, inv) => sum + Number(inv.amount), 0);
      const commissionFraction = this.toCommissionFraction(project.commissionRate);
      const netReceived = Number((totalInvested * (1 - commissionFraction)).toFixed(2));

      // Calculate milestone amount
      const milestoneAmount = Number((netReceived * (milestone.percentage / 100)).toFixed(2));

      milestone.status = MilestoneStatus.DISBURSED;
      await milestoneRepo.save(milestone);

      // Unlock next milestone if exists
      const nextMilestone = await milestoneRepo.findOne({ where: { projectId, stage: milestone.stage + 1 } });
      if (nextMilestone) {
        nextMilestone.status = MilestoneStatus.UPLOADING_PROOF;
        await milestoneRepo.save(nextMilestone);
      }

      const owner = await usersRepo.findOne({ where: { id: project.ownerId }, lock: { mode: 'pessimistic_write'} });
      if (owner && milestoneAmount > 0) {
        owner.balance = Number(owner.balance) + milestoneAmount;
        await usersRepo.save(owner);

        const ownerTx = transactionRepo.create({
          userId: project.ownerId,
          amount: milestoneAmount,
          type: TransactionType.DISBURSEMENT,
          status: TransactionStatus.SUCCESS,
          description: `Nhận vốn đợt ${milestone.stage} dự án ${project.title}`,
          referenceId: project.id,
        });
        await transactionRepo.save(ownerTx);
      }

      await this.notificationsService.createSpecialNotification(
        project.ownerId,
        `Giai đoạn ${milestone.stage} của dự án ${project.title} đã được phê duyệt. Số tiền ${milestoneAmount.toLocaleString('vi-VN')} ₫ đã được cộng vào ví của bạn.`,
        NotificationType.PAYMENT_SUCCESS
      );

      return milestone;
    });

    await this.syncProjectsDataJsonFile();
    return result;
  }

  async resolveDisputes(projectId: number, action: 'dismiss' | 'refund') {
    const result = await this.dataSource.transaction(async (manager) => {
      const projectRepo = manager.getRepository(ProjectEntity);
      const disputeRepo = manager.getRepository(ProjectDisputeEntity);
      const transactionRepo = manager.getRepository(TransactionEntity);
      const usersRepo = manager.getRepository(UserEntity);
      const investmentsRepo = manager.getRepository(InvestmentEntity);
      const milestoneRepo = manager.getRepository(ProjectMilestoneEntity);

      const project = await projectRepo.findOne({ where: { id: projectId }, lock: { mode: 'pessimistic_write'} });
      if (!project) throw new NotFoundException('Project not found');
      if (!project.isFrozen) throw new BadRequestException('Project is not frozen');

      if (action === 'dismiss') {
        project.isFrozen = false;
        await projectRepo.save(project);

        await disputeRepo.update({ projectId, status: DisputeStatus.OPEN }, { status: DisputeStatus.RESOLVED });

        await this.notificationsService.createSpecialNotification(
          project.ownerId,
          `Tranh chấp dự án ${project.title} đã được giải quyết. Bạn có thể tiếp tục.`,
          NotificationType.SYSTEM
        );
        return { message: 'Disputes dismissed, project unfrozen.' };
      } else if (action === 'refund') {
        project.status = ProjectStatus.FAILED;
        await projectRepo.save(project);

        await disputeRepo.update({ projectId, status: DisputeStatus.OPEN }, { status: DisputeStatus.REFUNDED });

        // Calculate remaining undisbursed funds
        const milestones = await milestoneRepo.find({ where: { projectId } });
        const disbursedPercentages = milestones
          .filter(m => m.status === MilestoneStatus.DISBURSED)
          .reduce((sum, m) => sum + m.percentage, 0);
          
        const remainingPercentage = 100 - disbursedPercentages;

        const projectInvestments = await investmentsRepo.find({
          where: { projectId: project.id, status: InvestmentStatus.ACTIVE },
          lock: { mode: 'pessimistic_write' }
        });

        // Refund investors remaining percentage of their initial investment
        for (const inv of projectInvestments) {
          const invUser = await usersRepo.findOne({ where: { id: inv.userId }, lock: { mode: 'pessimistic_write'} });
          if (!invUser) continue;

          const refundAmount = Number((Number(inv.amount) * (remainingPercentage / 100)).toFixed(2));
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

        // Penalize Owner (zero balance or deduct remaining... let's just 0 for now as prompt requested "Trừ hết số dư hiện tại")
        const owner = await usersRepo.findOne({ where: { id: project.ownerId }, lock: { mode: 'pessimistic_write'} });
        if (owner) {
          owner.balance = 0;
          await usersRepo.save(owner);
          
          await this.notificationsService.createSpecialNotification(
            owner.id,
            `Dự án ${project.title} đã bị hủy do khiếu nại. Hệ thống tiến hành thu hồi số dư của bạn.`,
            NotificationType.SYSTEM
          );
        }

        return { message: 'Project cancelled, remaining funds refunded, owner penalized.' };
      }
      throw new BadRequestException('Invalid action');
    });

    await this.syncProjectsDataJsonFile();
    return result;
  }

  async getFrozenProjects() {
    const projects = await this.projectsRepository.find({
      where: { isFrozen: true, status: ProjectStatus.COMPLETED }, // or FUNDING depending on when they reach milestone Phase
      relations: ['disputes', 'disputes.user'],
      order: { createdAt: 'DESC' }
    });

    return projects.map(p => ({
      ...this.serializeProject(p),
      disputes: p.disputes.map(d => ({
        id: d.id,
        reason: d.reason,
        evidenceUrl: d.evidenceUrl,
        status: d.status,
        user: d.user ? {
          id: d.user.id,
          fullName: d.user.fullName,
          email: d.user.email
        } : null
      }))
    }));
  }

  async rejectMilestone(projectId: number, milestoneId: number, reason: string) {
    const milestoneRepo = this.dataSource.getRepository(ProjectMilestoneEntity);
    const projectRepo = this.dataSource.getRepository(ProjectEntity);

    const milestone = await milestoneRepo.findOne({ where: { id: milestoneId, projectId } });
    if (!milestone) throw new NotFoundException('Milestone not found');
    if (milestone.status !== MilestoneStatus.ADMIN_REVIEW) throw new BadRequestException('Milestone is not in review stage');

    const project = await projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    milestone.status = MilestoneStatus.UPLOADING_PROOF;
    milestone.rejectionReason = reason;

    await milestoneRepo.save(milestone);

    await this.notificationsService.createSpecialNotification(
      project.ownerId,
      `Bằng chứng giải ngân đợt ${milestone.stage} dự án ${project.title} đã bị từ chối. Lý do: ${reason}`,
      NotificationType.SYSTEM
    );
    
    await this.syncProjectsDataJsonFile();
    return milestone;
  }

  async getPendingMilestones() {
    const milestoneRepo = this.dataSource.getRepository(ProjectMilestoneEntity);
    const milestones = await milestoneRepo.find({
      where: { status: MilestoneStatus.ADMIN_REVIEW },
      relations: ['project', 'project.owner'],
      order: { createdAt: 'ASC' }
    });

    return milestones.map(m => ({
      id: m.id,
      projectId: m.projectId,
      title: m.title,
      percentage: m.percentage,
      stage: m.stage,
      status: m.status,
      proofUrl: m.proofUrl,
      rejectionReason: m.rejectionReason,
      createdAt: m.createdAt,
      project: m.project ? {
        title: m.project.title,
        owner: m.project.owner ? {
          fullName: m.project.owner.fullName,
          email: m.project.owner.email
        } : null
      } : null
    }));
  }

  async createOrUpdateMilestones(projectId: number, ownerId: number, milestonesData: { title: string; percentage: number; stage: number }[]) {
    return this.dataSource.transaction(async (manager) => {
      const projectRepo = manager.getRepository(ProjectEntity);
      const milestoneRepo = manager.getRepository(ProjectMilestoneEntity);

      const project = await projectRepo.findOne({ where: { id: projectId }});
      if (!project) throw new NotFoundException('Project not found');
      if (project.ownerId !== ownerId) throw new ForbiddenException('Only owner can modify milestones');
      if (project.status !== ProjectStatus.PENDING) throw new BadRequestException('Can only modify milestones when project is pending');

      const totalPercentage = milestonesData.reduce((sum, m) => sum + Number(m.percentage), 0);
      if (totalPercentage !== 100) {
        throw new BadRequestException('Total milestone percentage must exactly equal 100%');
      }

      await milestoneRepo.delete({ projectId });

      const newMilestones = milestonesData.map(m => milestoneRepo.create({
        projectId: project.id,
        title: m.title,
        percentage: Number(m.percentage),
        stage: Number(m.stage),
        status: m.stage === 1 ? MilestoneStatus.DISBURSED : (m.stage === 2 ? MilestoneStatus.UPLOADING_PROOF : MilestoneStatus.PENDING)
      }));

      await milestoneRepo.save(newMilestones);
      
      return newMilestones;
    });
  }
}
