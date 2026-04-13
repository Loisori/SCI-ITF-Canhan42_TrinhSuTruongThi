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
import { 
  ProjectMilestoneEntity, 
  MilestoneStatus 
} from './entities/milestone.entity';
import { MilestoneVoteEntity } from './entities/vote.entity';
import { MilestoneDiscussionEntity } from './entities/discussion.entity';
import { ProjectDisputeEntity, DisputeStatus } from './entities/dispute.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { KycStatus } from '../users/entities/kyc.entity';



@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectsRepository: Repository<ProjectEntity>,
    @InjectRepository(ProjectMediaEntity)
    private readonly projectMediaRepository: Repository<ProjectMediaEntity>,
    @InjectRepository(ProjectCategoryEntity)
    private readonly projectCategoriesRepository: Repository<ProjectCategoryEntity>,
    @InjectRepository(MilestoneVoteEntity)
    private readonly milestoneVotesRepository: Repository<MilestoneVoteEntity>,
    @InjectRepository(MilestoneDiscussionEntity)
    private readonly milestoneDiscussionRepository: Repository<MilestoneDiscussionEntity>,
    private readonly dataSource: DataSource,

    private readonly eventEmitter: EventEmitter2,
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

  async getProjectsByStatus(status: ProjectStatus) {
    const projects = await this.projectsRepository.find({
      where: { status },
      relations: ['media', 'category', 'owner'],
      order: { createdAt: 'DESC' },
    });
    return projects.map((project) => this.serializeProject(project));
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
      throw new BadRequestException('Chỉ có thể giải ngân cho dự án đã huy động xong và đang chờ duyệt.');
    }

    const stage1 = project.milestones.find((m) => m.stage === 1);
    if (!stage1) {
      throw new BadRequestException('Không tìm thấy thông tin giải ngân đợt 1.');
    }

    // Set project to ACTIVE
    await this.projectsRepository.update(projectId, { 
      status: ProjectStatus.ACTIVE 
    });

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
      status: ProjectStatus.FAILED 
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
      await this.processMilestoneFinalResult(milestone);
    }

    return { message: 'Thời gian đã được tua nhanh thành công.' };
  }

  private async notifyProjectOwner(owner: UserEntity, message: string) {
    if (!owner) return;
    console.log(`[DEPRECATED] notifyProjectOwner for owner ${owner.id}: ${message}`);
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

    if(
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
        allowOverfunding: !!dto.allowOverfunding,
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

      // Giải ngân đợt 1 (Stage 1)
      const milestonesRepo = manager.getRepository(ProjectMilestoneEntity);
      const milestones = await milestonesRepo.find({
        where: { projectId: project.id },
        order: { stage: 'ASC' },
      });

      if (milestones.length === 0) {
        throw new BadRequestException(
          'Dự án chưa được thiết lập các giai đoạn giải ngân.',
        );
      }

      const stage1 = milestones.find((m) => m.stage === 1);
      const stage2 = milestones.find((m) => m.stage === 2);

      if (!stage1) {
        throw new BadRequestException('Không tìm thấy thông tin giải ngân đợt 1.');
      }

      // Update Stage 1
      stage1.status = MilestoneStatus.DISBURSED;
      stage1.disbursementDate = new Date();
      await milestonesRepo.save(stage1);

      // Unlock stage 2 for owner to upload proof
      if (stage2) {
        stage2.status = MilestoneStatus.UPLOADING_PROOF;
        await milestonesRepo.save(stage2);
      }

      const firstDisbursement = Number(
        (netReceived * (stage1.percentage / 100)).toFixed(2),
      );


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
      }

      return {
        message: 'Dự án đã dừng nhận vốn.',
        id: project.id,
        status: project.status,
        commissionFraction,
        commissionAmount,
        netReceived,
        interestPayouts: Array.from(interestByInvestor.entries()).map(([investorId, amount]) => ({
          investorId,
          amount,
          title: project.title
        }))
      };
    });

    // Notify investors about interest paid OUTSIDE transaction
    if (result.interestPayouts) {
      for (const payout of result.interestPayouts) {
        if (payout.amount > 0) {
          this.eventEmitter.emit('project.interestPaid', payout);
        }
      }
    }

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
            : 'Dự án đã đạt mục tiêu huy động.'
        );
      }

      user.balance = userBalance - amount;
      project.currentAmount = currentCapital + amount;

      // Auto close funding if goal reached and overfunding disabled
      if (!project.allowOverfunding && project.currentAmount >= goalAmount) {
        project.status = ProjectStatus.PENDING_ADMIN_REVIEW;
      }

      await usersRepo.save(user);
      await projectsRepo.save(project);

      return {
        message: 'Investment successful.',
        investedAmount: amount,
        userBalance: user.balance,
        project: this.serializeProject(project),
        projectTitle: project.title,
        projectOwnerId: project.ownerId,
        isGoalReached: currentCapital + amount >= Number(project.goalAmount),
      };
    }).then((result) => {
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
      milestones: project.milestones?.map(m => ({
        id: m.id,
        title: m.title,
        percentage: m.percentage,
        stage: m.stage,
        status: m.status,
        evidenceUrls: m.evidenceUrls,
        createdAt: m.createdAt,
      })),
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
    const disbursementData = await this.dataSource.transaction(async (manager) => {
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

      return {
        milestone,
        ownerId: project.ownerId,
        projectTitle: project.title,
        milestoneAmount,
        stage: milestone.stage
      };
    });

    // Notify outside transaction
    await this.notificationsService.createSpecialNotification(
      disbursementData.ownerId,
      `Giai đoạn ${disbursementData.stage} của dự án ${disbursementData.projectTitle} đã được phê duyệt. Số tiền ${disbursementData.milestoneAmount.toLocaleString('vi-VN')} ₫ đã được cộng vào ví của bạn.`,
      NotificationType.PAYMENT_SUCCESS
    );

    await this.syncProjectsDataJsonFile();
    return disbursementData.milestone;
  }


  async resolveDisputes(projectId: number, action: 'dismiss' | 'refund') {
    const resolutionData = await this.dataSource.transaction(async (manager) => {
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

        return { 
          action, 
          ownerId: project.ownerId, 
          projectTitle: project.title,
          message: 'Disputes dismissed, project unfrozen.' 
        };
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

        // Penalize Owner
        const owner = await usersRepo.findOne({ where: { id: project.ownerId }, lock: { mode: 'pessimistic_write'} });
        if (owner) {
          owner.balance = 0;
          await usersRepo.save(owner);
        }

        return { 
          action, 
          ownerId: project.ownerId, 
          projectTitle: project.title,
          message: 'Project cancelled, remaining funds refunded, owner penalized.' 
        };
      }
      throw new BadRequestException('Invalid action');
    });

    // Notify outside transaction
    if (resolutionData.action === 'dismiss') {
      await this.notificationsService.createSpecialNotification(
        resolutionData.ownerId,
        `Tranh chấp dự án ${resolutionData.projectTitle} đã được giải quyết. Bạn có thể tiếp tục.`,
        NotificationType.SYSTEM
      );
    } else if (resolutionData.action === 'refund') {
      await this.notificationsService.createSpecialNotification(
        resolutionData.ownerId,
        `Dự án ${resolutionData.projectTitle} đã bị hủy do khiếu nại. Hệ thống tiến hành thu hồi số dư của bạn.`,
        NotificationType.SYSTEM
      );
    }

    await this.syncProjectsDataJsonFile();
    return { message: resolutionData.message };
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

  async uploadMilestoneProof(
    projectId: number,
    milestoneId: number,
    ownerId: number,
    evidenceUrls: string[],
  ) {
    const milestoneRepo = this.dataSource.getRepository(ProjectMilestoneEntity);
    const projectRepo = this.dataSource.getRepository(ProjectEntity);

    const milestone = await milestoneRepo.findOne({
      where: { id: milestoneId, projectId },
    });
    if (!milestone) throw new NotFoundException('Milestone not found');
    if (milestone.status !== MilestoneStatus.UPLOADING_PROOF) {
      throw new BadRequestException(
        'Không thể cập nhật bằng chứng ở giai đoạn này.',
      );
    }

    const project = await projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== ownerId) {
      throw new ForbiddenException('Only project owner can upload proof');
    }

    milestone.evidenceUrls = evidenceUrls;
    // Status stays at UPLOADING_PROOF until 'Start Voting' is explicitly clicked
    await milestoneRepo.save(milestone);

    await this.syncProjectsDataJsonFile();
    return milestone;
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

  async getDisputedMilestones() {
    const milestoneRepo = this.dataSource.getRepository(ProjectMilestoneEntity);
    return milestoneRepo.find({
      where: [
        { status: MilestoneStatus.DISPUTED },
        { status: MilestoneStatus.ADMIN_REVIEW }
      ],
      relations: ['project', 'project.owner'],
      order: { createdAt: 'DESC' }
    });
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
      evidenceUrls: m.evidenceUrls,
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

  async startMilestoneVoting(milestoneId: number, ownerId: number) {
    const milestoneRepo = this.dataSource.getRepository(ProjectMilestoneEntity);
    const milestone = await milestoneRepo.findOne({
      where: { id: milestoneId },
      relations: ['project'],
    });

    if (!milestone)
      throw new NotFoundException('Không tìm thấy giai đoạn giải ngân.');
    if (milestone.project.ownerId !== ownerId) {
      throw new ForbiddenException(
        'Bạn không có quyền bắt đầu bầu chọn cho dự án này.',
      );
    }

    if (milestone.status !== MilestoneStatus.UPLOADING_PROOF) {
      throw new BadRequestException(
        'Trạng thái giai đoạn không hợp lệ để bắt đầu bầu chọn.',
      );
    }

    if (!milestone.evidenceUrls || milestone.evidenceUrls.length === 0) {
      throw new BadRequestException(
        'Vui lòng cập nhật bằng chứng tiến độ trước khi bắt đầu bầu chọn.',
      );
    }

    milestone.status = MilestoneStatus.VOTING;
    milestone.votingEndsAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours
    await milestoneRepo.save(milestone);

    // Notify investors (Async)
    this.eventEmitter.emit('milestone.votingStarted', {
      projectId: milestone.projectId,
      milestoneId: milestone.id,
      title: milestone.title,
      projectTitle: milestone.project.title,
    });

    return milestone;
  }

  async submitVote(userId: number, milestoneId: number, isApprove: boolean, comment?: string) {
    const milestoneRepo = this.dataSource.getRepository(ProjectMilestoneEntity);
    const milestone = await milestoneRepo.findOne({
      where: { id: milestoneId },
    });

    if (!milestone) throw new NotFoundException('Milestone not found');
    if (milestone.status !== MilestoneStatus.VOTING) {
      throw new BadRequestException(
        'Giai đoạn này không trong thời gian bầu chọn.',
      );
    }

    if (milestone.votingEndsAt && new Date() > milestone.votingEndsAt) {
      throw new BadRequestException('Thời gian bầu chọn đã kết thúc.');
    }

    // Check if user is an investor
    const investmentRepo = this.dataSource.getRepository(InvestmentEntity);
    const investments = await investmentRepo.find({
      where: { projectId: milestone.projectId, userId: userId },
    });

    const activeInvestments = investments.filter(
      (inv) => inv.status !== InvestmentStatus.WITHDRAWN,
    );
    const totalInvested = activeInvestments.reduce(
      (sum, inv) => sum + Number(inv.amount),
      0,
    );

    if (totalInvested <= 0) {
      throw new ForbiddenException(
        'Bạn phải là nhà đầu tư của dự án này mới có thể bầu chọn.',
      );
    }

    const investorWeight = totalInvested;

    let vote = await this.milestoneVotesRepository.findOne({
      where: { milestoneId, userId },
    });

    if (vote) {
      vote.isApprove = isApprove;
      vote.comment = comment || null;
      vote.investorCapital = investorWeight;
    } else {
      vote = this.milestoneVotesRepository.create({
        milestoneId,
        userId,
        isApprove,
        comment: comment || null,
        investorCapital: investorWeight,
      });
    }

    await this.milestoneVotesRepository.save(vote);
    return { 
      message: 'Bầu chọn thành công.', 
      isApprove, 
      weight: investorWeight.toLocaleString() + ' ₫' 
    };
  }

  async closeExpiredVotes() {
    const milestoneRepo = this.dataSource.getRepository(ProjectMilestoneEntity);
    // Find all VOTING milestones where votingEndsAt <= now
    const now = new Date();
    const votingMilestones = await milestoneRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.project', 'project')
      .where('m.status = :status', { status: MilestoneStatus.VOTING })
      .andWhere('m.votingEndsAt <= :now', { now })
      .getMany();

    for (const milestone of votingMilestones) {
      await this.processMilestoneFinalResult(milestone);
    }
  }

  private async processMilestoneFinalResult(milestone: ProjectMilestoneEntity) {
    const investmentRepo = this.dataSource.getRepository(InvestmentEntity);
    const votesRepo = this.milestoneVotesRepository;

    // 1. Get total raised funds for this project from all valid investments
    const project = milestone.project;
    const totalRaised = Number(project.currentAmount);

    // 2. Calculate total YES weight from votes
    const yesVotes = await votesRepo.find({
      where: { milestoneId: milestone.id, isApprove: true },
    });
    const yesWeight = yesVotes.reduce((sum, v) => sum + Number(v.investorCapital), 0);

    // 3. Condition: YES weight >= 50% of totalRaised (User requested >= 50%)
    if (yesWeight >= totalRaised * 0.5) {
      await this.disburseMilestoneFunds(milestone.id);
    } else {
      milestone.status = MilestoneStatus.DISPUTED;
      await this.dataSource
        .getRepository(ProjectMilestoneEntity)
        .save(milestone);

      this.eventEmitter.emit('milestone.disputed', {
        projectId: milestone.projectId,
        milestoneId: milestone.id,
        title: milestone.title,
      });
    }
  }

  async disburseMilestoneFunds(milestoneId: number) {
    const eventData = await this.dataSource.transaction(async (manager) => {
      const milestoneRepo = manager.getRepository(ProjectMilestoneEntity);
      const projectRepo = manager.getRepository(ProjectEntity);
      const usersRepo = manager.getRepository(UserEntity);
      const transactionRepo = manager.getRepository(TransactionEntity);
      const investmentRepo = manager.getRepository(InvestmentEntity);

      const milestone = await milestoneRepo.findOne({
        where: { id: milestoneId },
        relations: ['project'],
      });
      if (!milestone || milestone.status === MilestoneStatus.COMPLETED) {
        return { status: 'skipped' };
      }

      const project = milestone.project;

      // Calculate disbursementAmount from netReceived
      const projectInvestments = await investmentRepo.find({
        where: { projectId: project.id },
      });
      const totalInvested = projectInvestments
        .filter((inv) => inv.status !== InvestmentStatus.WITHDRAWN)
        .reduce((sum, inv) => sum + Number(inv.amount), 0);

      const commissionFraction = this.toCommissionFraction(
        project.commissionRate,
      );
      const commissionAmount = Number(
        (totalInvested * commissionFraction).toFixed(2),
      );
      const netReceived = totalInvested - commissionAmount;

      const disbursementAmount = Number(
        (netReceived * (milestone.percentage / 100)).toFixed(2),
      );

      // 1. Update status
      milestone.status = MilestoneStatus.COMPLETED;
      milestone.disbursementDate = new Date();
      await milestoneRepo.save(milestone);

      // 2. Unlock next milestone if exists
      const nextMilestone = await milestoneRepo.findOne({
        where: { projectId: project.id, stage: milestone.stage + 1 },
      });
      if (nextMilestone) {
        // Calculate when the next milestone can start (Now + current interval)
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + (milestone.intervalDays || 0));
        
        nextMilestone.status = MilestoneStatus.PENDING;
        nextMilestone.nextDisbursementDate = nextDate;
        await milestoneRepo.save(nextMilestone);
      } else {
        // No more milestones = project fully disbursed
        project.status = ProjectStatus.COMPLETED;
        
        // Calculate final debt: Principal + (Principal * Interest Rate %)
        const principal = Number(project.currentAmount);
        const interest = principal * (Number(project.interestRate) / 100);
        project.totalDebt = principal + interest;
        
        await projectRepo.save(project);
      }

      // 3. Credit Owner
      const owner = await usersRepo.findOne({
        where: { id: project.ownerId },
        lock: { mode: 'pessimistic_write' },
      });
      if (owner && disbursementAmount > 0) {
        owner.balance = Number(owner.balance) + disbursementAmount;
        await usersRepo.save(owner);

        const ownerTx = transactionRepo.create({
          userId: project.ownerId,
          amount: disbursementAmount,
          type: TransactionType.DISBURSEMENT,
          status: TransactionStatus.SUCCESS,
          description: `Giải ngân đợt ${milestone.stage} dự án ${project.title}`,
          referenceId: project.id,
        });
        await transactionRepo.save(ownerTx);
      }

      return { 
        status: 'success', 
        amount: disbursementAmount,
        projectId: project.id,
        milestoneId: milestone.id,
        title: milestone.title,
        ownerId: project.ownerId
      };
    });

    if (eventData.status === 'success') {
      // Notify outside transaction
      this.eventEmitter.emit('milestone.completed', {
        projectId: eventData.projectId,
        milestoneId: eventData.milestoneId,
        amount: eventData.amount,
        title: eventData.title,
        ownerId: eventData.ownerId,
      });
    }

    return eventData;
  }



  // --- Admin Mediation ---

  async adminMilestoneFeedback(milestoneId: number, adminId: number, content: string) {
    const milestoneRepo = this.dataSource.getRepository(ProjectMilestoneEntity);
    const milestone = await milestoneRepo.findOne({ where: { id: milestoneId }, relations: ['project'] });
    if (!milestone) throw new NotFoundException('Milestone not found');

    const discussion = this.milestoneDiscussionRepository.create({
      milestoneId,
      senderId: adminId,
      content,
    });
    await this.milestoneDiscussionRepository.save(discussion);

    milestone.status = MilestoneStatus.ADMIN_REVIEW;
    await milestoneRepo.save(milestone);

    // Notify Owner
    await this.notificationsService.createSpecialNotification(
      milestone.project.ownerId,
      `Admin đã phản hồi về tranh chấp Giai đoạn ${milestone.stage}: ${content}`,
      NotificationType.SYSTEM
    );

    return discussion;
  }

  async adminResetMilestoneVote(milestoneId: number) {
    const milestoneRepo = this.dataSource.getRepository(ProjectMilestoneEntity);
    const milestone = await milestoneRepo.findOne({ where: { id: milestoneId }, relations: ['project'] });
    if (!milestone) throw new NotFoundException('Milestone not found');

    // 1. Delete old votes
    await this.milestoneVotesRepository.delete({ milestoneId });

    // 2. Reset status and timer
    milestone.status = MilestoneStatus.VOTING;
    milestone.votingEndsAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h
    await milestoneRepo.save(milestone);

    // Notify Investors
    this.eventEmitter.emit('milestone.voting_reset', {
      projectId: milestone.projectId,
      milestoneId: milestone.id,
      title: milestone.title,
    });

    return milestone;
  }

  async adminTerminateProject(projectId: number, adminId: number, reason: string) {
    return this.dataSource.transaction(async (manager) => {
      const projectRepo = manager.getRepository(ProjectEntity);
      const milestoneRepo = manager.getRepository(ProjectMilestoneEntity);
      const investmentRepo = manager.getRepository(InvestmentEntity);
      const userRepo = manager.getRepository(UserEntity);
      const transactionRepo = manager.getRepository(TransactionEntity);

      const project = await projectRepo.findOne({ where: { id: projectId } });
      if (!project) throw new NotFoundException('Project not found');

      // 1. Calculate Remaining Balance
      const milestones = await milestoneRepo.find({ where: { projectId: project.id } });
      const completedMilestones = milestones.filter(m => m.status === MilestoneStatus.COMPLETED);
      const totalPercentageDisbursed = completedMilestones.reduce((sum, m) => sum + Number(m.percentage), 0);
      const remainingPercentage = 100 - totalPercentageDisbursed;
      
      const totalRaised = Number(project.currentAmount); 
      // Remaining Balance (Gross) = totalRaised * (remainingPercentage / 100)
      // This ensures platform "bears the loss" of commission for refunded milestones.
      const remainingBalanceToRefund = Number((totalRaised * (remainingPercentage / 100)).toFixed(2));

      // 2. Refund Investors
      const investments = await investmentRepo.find({ where: { projectId: project.id, status: InvestmentStatus.ACTIVE } });
      
      for (const inv of investments) {
        const initialAmount = Number(inv.amount);
        // Refund = (Initial Investment / Total Goal) * Remaining Balance
        // Note: project.currentAmount is what was actually raised.
        const refundAmount = Number(((initialAmount / totalRaised) * remainingBalanceToRefund).toFixed(2));

        if (refundAmount > 0) {
          const investor = await userRepo.findOne({ where: { id: inv.userId }, lock: { mode: 'pessimistic_write' } });
          if (investor) {
            investor.balance = Number(investor.balance) + refundAmount;
            await userRepo.save(investor);

            const tx = transactionRepo.create({
              userId: inv.userId,
              amount: refundAmount,
              type: TransactionType.REFUND,
              status: TransactionStatus.SUCCESS,
              description: `Hoàn tiền dự án ${project.title} (Tranh chấp Milestone)`,
              referenceId: project.id,
            });
            await transactionRepo.save(tx);
          }
        }
        
        inv.status = InvestmentStatus.WITHDRAWN;
        await investmentRepo.save(inv);
      }

      // 3. Update Project & Milestone Status
      project.status = ProjectStatus.FAILED;
      await projectRepo.save(project);

      const disputedMilestone = milestones.find(m => m.status === MilestoneStatus.DISPUTED || m.status === MilestoneStatus.ADMIN_REVIEW);
      if (disputedMilestone) {
        disputedMilestone.status = MilestoneStatus.REJECTED;
        await milestoneRepo.save(disputedMilestone);
      }

      // 4. Record Discussion
      const discussion = this.milestoneDiscussionRepository.create({
        milestoneId: disputedMilestone?.id || 0,
        senderId: adminId,
        content: `DỰ ÁN BỊ HỦY. Lý do: ${reason}`,
      });
      await this.milestoneDiscussionRepository.save(discussion);

      return { remainingBalance: remainingBalanceToRefund, refundCount: investments.length };
    });
  }


  async ownerMilestoneResponse(milestoneId: number, ownerId: number, content: string) {
    const milestoneRepo = this.dataSource.getRepository(ProjectMilestoneEntity);
    const milestone = await milestoneRepo.findOne({ where: { id: milestoneId }, relations: ['project'] });
    if (!milestone) throw new NotFoundException('Milestone not found');
    if (milestone.project.ownerId !== ownerId) throw new ForbiddenException('Not your project');

    const discussion = this.milestoneDiscussionRepository.create({
      milestoneId,
      senderId: ownerId,
      content,
    });
    await this.milestoneDiscussionRepository.save(discussion);

    return discussion;
  }

  async getMilestoneDiscussions(milestoneId: number) {
    return this.milestoneDiscussionRepository.find({
      where: { milestoneId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
  }
}



