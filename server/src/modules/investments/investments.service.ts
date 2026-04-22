import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, LessThan } from 'typeorm';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {
  InvestmentEntity,
  InvestmentStatus,
} from './entities/investment.entity';
import {
  PaymentScheduleEntity,
  PaymentScheduleStatus,
} from './entities/schedule.entity';
import {
  ProjectEntity,
  ProjectStatus,
} from '../projects/entities/project.entity';
import {
  ProjectMilestoneEntity,
  MilestoneStatus,
} from '../projects/entities/milestone.entity';
import { UserEntity } from '../users/entities/user.entity';
import {
  TransactionEntity,
  TransactionStatus,
  TransactionType,
} from '../transactions/entities/transaction.entity';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FinancialCalculator } from '../../common/utils/financial-calculator';
import { UsersService } from '../users/users.service';

@Injectable()
export class InvestmentsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly usersService: UsersService,
  ) {}

  private toCommissionFraction(commissionRate?: number | null): number {
    const raw = Number(commissionRate ?? 0);
    if (!Number.isFinite(raw) || raw <= 0) return 0;
    // - nếu lưu % (5 -> 0.05) hoặc fraction (0.05 -> 0.05)
    return raw > 1 ? raw / 100 : raw;
  }

  async getMyInvestments(userId: number) {
    const investmentsRepo = this.dataSource.getRepository(InvestmentEntity);

    const investments = await investmentsRepo.find({
      where: { userId },
      relations: ['project', 'project.media', 'paymentSchedules'],
      order: { investedAt: 'DESC' },
    });

    return investments.map((investment) => {
      const thumbnail =
        investment.project?.media?.find((media) => media.isThumbnail)?.url ??
        investment.project?.media?.[0]?.url ??
        null;

      const paymentSchedules = (investment.paymentSchedules ?? [])
        .slice()
        .sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
        )
        .map((schedule) => ({
          id: schedule.id,
          dueDate: schedule.dueDate,
          amount: Number(schedule.amount),
          status: schedule.status,
          paidAt: schedule.paidAt,
        }));

      return {
        id: investment.id,
        amount: Number(investment.amount),
        status: investment.status,
        investedAt: investment.investedAt,
        project: investment.project
          ? {
              id: investment.project.id,
              title: investment.project.title,
              slug: investment.project.slug,
              interestRate: Number(investment.project.interestRate),
              durationMonths: investment.project.durationMonths,
              thumbnailUrl: thumbnail,
            }
          : null,
        paymentSchedules,
      };
    });
  }

  async getPublicInvestedProjects(userIdentifier: string) {
    const investmentsRepo = this.dataSource.getRepository(InvestmentEntity);

    let userId: number;
    // Check if it's a numeric ID
    const numericId = parseInt(userIdentifier, 10);
    if (!isNaN(numericId) && /^\d+$/.test(userIdentifier)) {
      userId = numericId;
    } else {
      const user = await this.usersService.findBySlug(userIdentifier);
      if (!user) throw new NotFoundException('User not found');
      userId = user.id;
    }

    // Find all active/completed investments for this user
    const investments = await investmentsRepo.find({
      where: {
        userId,
        status: InvestmentStatus.ACTIVE, // Or COMPLETED, etc. basically not withdrawn
      },
      relations: [
        'project',
        'project.media',
        'project.category',
        'project.owner',
      ],
      order: { investedAt: 'DESC' },
    });

    // Extract unique projects
    const projectsMap = new Map<number, any>();

    for (const inv of investments) {
      if (!inv.project || projectsMap.has(inv.project.id)) continue;

      const project = inv.project;
      const thumbnail =
        project.media?.find((media) => media.isThumbnail)?.url ??
        project.media?.[0]?.url ??
        null;

      projectsMap.set(project.id, {
        id: project.id,
        title: project.title,
        slug: project.slug,
        thumbnailUrl: thumbnail,
        currentCapital: Number(project.currentAmount),
        targetCapital: Number(project.goalAmount),
        status: project.status,
        category: project.category
          ? {
              name: project.category.name,
              slug: project.category.slug,
            }
          : null,
        owner: project.owner
          ? {
              fullName: project.owner.fullName,
            }
          : null,
        fundingProgress:
          project.goalAmount > 0
            ? Number(
                (
                  (Number(project.currentAmount) / Number(project.goalAmount)) *
                  100
                ).toFixed(2),
              )
            : 0,
      });
    }

    return Array.from(projectsMap.values());
  }

  async invest(userId: number, dto: CreateInvestmentDto) {
    return this.dataSource
      .transaction(async (manager) => {
        const usersRepo = manager.getRepository(UserEntity);
        const projectsRepo = manager.getRepository(ProjectEntity);
        const investmentsRepo = manager.getRepository(InvestmentEntity);
        const schedulesRepo = manager.getRepository(PaymentScheduleEntity);
        const transactionsRepo = manager.getRepository(TransactionEntity);

        const user = await usersRepo.findOne({
          where: { id: userId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!user) {
          throw new NotFoundException('User not found.');
        }

        const project = await projectsRepo.findOne({
          where: { id: dto.projectId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!project) {
          throw new NotFoundException('Project not found.');
        }

        const now = new Date();
        if (
          project.endDate &&
          new Date(project.endDate).getTime() < now.getTime()
        ) {
          await this.handleProjectTimeout(project.id, manager);
          throw new BadRequestException('Dự án đã hết thời gian huy động vốn.');
        }

        if (project.status !== ProjectStatus.FUNDING) {
          throw new BadRequestException('Project is not in funding status.');
        }

        const amount = Number(dto.amount);
        if (amount < Number(project.minInvestment)) {
          throw new BadRequestException(
            `Minimum investment is ${project.minInvestment}.`,
          );
        }

        if (Number(user.balance) < amount) {
          throw new BadRequestException('Insufficient balance.');
        }

        user.balance = Number(user.balance) - amount;
        project.currentAmount = Number(project.currentAmount) + amount;

        await usersRepo.save(user);
        await projectsRepo.save(project);

        const investment = investmentsRepo.create({
          userId,
          projectId: project.id,
          amount,
          status: InvestmentStatus.ACTIVE,
        });

        const savedInvestment = await investmentsRepo.save(investment);

        const monthlyInterest = this.roundCurrency(
          (amount * Number(project.interestRate)) / 100 / 12,
        );

        const schedules: PaymentScheduleEntity[] = [];
        for (let month = 1; month <= project.durationMonths; month += 1) {
          const dueDate = new Date(now);
          dueDate.setMonth(dueDate.getMonth() + month);
          const scheduleAmount =
            month === project.durationMonths
              ? this.roundCurrency(monthlyInterest + amount)
              : monthlyInterest;

          schedules.push(
            schedulesRepo.create({
              investmentId: savedInvestment.id,
              dueDate,
              amount: scheduleAmount,
              status: PaymentScheduleStatus.UNPAID,
              paidAt: null,
            }),
          );
        }

        if (schedules.length > 0) {
          await schedulesRepo.save(schedules);
        }

        const transaction = transactionsRepo.create({
          userId,
          amount,
          type: TransactionType.INVEST,
          status: TransactionStatus.SUCCESS,
          description: `Đầu tư vào dự án ${project.title}`,
          referenceId: savedInvestment.id,
        });

        await transactionsRepo.save(transaction);

        return {
          message: 'Đầu tư thành công.',
          investmentId: savedInvestment.id,
          userBalance: user.balance,
          projectCurrentAmount: project.currentAmount,
          paymentScheduleCount: schedules.length,
          projectTitle: project.title,
          projectOwnerId: project.ownerId,
          isGoalReached:
            Number(project.currentAmount) >= Number(project.goalAmount),
          amount,
        };
      })
      .then((result) => {
        // Bắn sự kiện ra ngoài Transaction để tránh Lag
        this.eventEmitter.emit('investment.made', {
          ownerId: result.projectOwnerId,
          amount: result.amount,
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

  async handleProjectTimeout(projectId?: number, manager?: EntityManager) {
    const run = async (txManager: EntityManager) => {
      const projectsRepo = txManager.getRepository(ProjectEntity);
      const investmentsRepo = txManager.getRepository(InvestmentEntity);
      const usersRepo = txManager.getRepository(UserEntity);
      const transactionsRepo = txManager.getRepository(TransactionEntity);

      const now = new Date();
      const expiredProjects = await projectsRepo.find({
        where: {
          ...(projectId ? { id: projectId } : {}),
          status: ProjectStatus.FUNDING,
          endDate: LessThan(now),
        },
        lock: { mode: 'pessimistic_write' },
      });

      let refundedInvestments = 0;
      let refundedAmount = 0;

      for (const project of expiredProjects) {
        const goalAmount = Number(project.goalAmount);
        const currentAmount = Number(project.currentAmount);

        if (currentAmount >= goalAmount) {
          const projectInvestments = await investmentsRepo.find({
            where: {
              projectId: project.id,
            },
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
          const netReceived = Number(
            (totalInvested - commissionAmount).toFixed(2),
          );

          if (this.toCommissionFraction(project.commissionRate) <= 0) {
            const ownerCompletedCount = await projectsRepo.count({
              where: {
                ownerId: project.ownerId,
                status: ProjectStatus.COMPLETED,
              },
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

          project.totalDebt = FinancialCalculator.calculateTotalDebt(
            currentAmount,
            project.interestRate,
            project.durationMonths,
            project.commissionRate,
          );
          project.status = ProjectStatus.PENDING_ADMIN_REVIEW;
          await projectsRepo.save(project);

          // Create 5 milestones
          const milestonesRepo = txManager.getRepository(
            ProjectMilestoneEntity,
          );
          const milestones: ProjectMilestoneEntity[] = [];
          for (let i = 1; i <= 5; i++) {
            milestones.push(
              milestonesRepo.create({
                projectId: project.id,
                title: `Giai đoạn ${i} (20%)`,
                percentage: 20,
                stage: i,
                status:
                  i === 1
                    ? MilestoneStatus.ADMIN_REVIEW
                    : MilestoneStatus.PENDING,
              }),
            );
          }
          await milestonesRepo.save(milestones);

          continue;
        }

        const projectInvestments = await investmentsRepo.find({
          where: {
            projectId: project.id,
            status: InvestmentStatus.ACTIVE,
          },
          lock: { mode: 'pessimistic_write' },
        });

        for (const investment of projectInvestments) {
          const amount = Number(investment.amount);

          const existedRefund = await transactionsRepo.findOne({
            where: {
              type: TransactionType.REFUND,
              referenceId: investment.id,
            },
          });

          if (existedRefund) {
            investment.status = InvestmentStatus.WITHDRAWN;
            await investmentsRepo.save(investment);
            continue;
          }

          const user = await usersRepo.findOne({
            where: { id: investment.userId },
            lock: { mode: 'pessimistic_write' },
          });

          if (!user) {
            continue;
          }

          user.balance = Number(user.balance) + amount;
          investment.status = InvestmentStatus.WITHDRAWN;

          await usersRepo.save(user);
          await investmentsRepo.save(investment);

          const refundTransaction = transactionsRepo.create({
            userId: investment.userId,
            amount,
            type: TransactionType.REFUND,
            status: TransactionStatus.SUCCESS,
            description: `Hoàn tiền dự án ${project.title} do không đạt mục tiêu`,
            referenceId: investment.id,
          });
          await transactionsRepo.save(refundTransaction);

          // Notify investor about refund - Emit event instead of direct call
          this.eventEmitter.emit('project.refunded', {
            investorId: investment.userId,
            amount,
            title: project.title,
          });

          refundedInvestments += 1;
          refundedAmount += amount;
        }

        project.status = ProjectStatus.FAILED;
        project.currentAmount = 0;
        await projectsRepo.save(project);
      }

      return {
        processedProjects: expiredProjects.length,
        refundedInvestments,
        refundedAmount: this.roundCurrency(refundedAmount),
      };
    };

    if (manager) {
      return run(manager);
    }

    const result = await this.dataSource.transaction(async (txManager) =>
      run(txManager),
    );
    await this.syncProjectsDataJsonFile();
    return result;
  }

  private async syncProjectsDataJsonFile() {
    try {
      const projectsRepo = this.dataSource.getRepository(ProjectEntity);
      const projects = await projectsRepo.find({
        relations: ['media', 'category', 'owner', 'milestones', 'disputes'],
        order: { createdAt: 'DESC' },
      });

      const payload = projects.map((project) => {
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
          content: project.content ?? null,
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
          isFrozen: project.isFrozen,
          createdAt: project.createdAt,
          milestones: project.milestones?.map((m) => ({
            id: m.id,
            title: m.title,
            percentage: m.percentage,
            stage: m.stage,
            status: m.status,
            evidenceUrls: m.evidenceUrls,
            createdAt: m.createdAt,
          })),
          disputes: project.disputes?.map((d) => ({
            id: d.id,
            userId: d.userId,
            reason: d.reason,
            evidenceUrl: d.evidenceUrl,
            status: d.status,
            createdAt: d.createdAt,
          })),
        };
      });

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
        '[InvestmentsService] Failed to sync projects-data.json:',
        error,
      );
    }
  }

  async getAnalytics(userId: number) {
    const investmentsRepo = this.dataSource.getRepository(InvestmentEntity);
    const schedulesRepo = this.dataSource.getRepository(PaymentScheduleEntity);

    // 1. Allocation data: Group by category
    const allocation = await investmentsRepo
      .createQueryBuilder('investment')
      .leftJoin('investment.project', 'project')
      .leftJoin('project.category', 'category')
      .select('category.name', 'category')
      .addSelect('SUM(investment.amount)', 'value')
      .where('investment.userId = :userId', { userId })
      .andWhere('investment.status != :status', {
        status: InvestmentStatus.WITHDRAWN,
      })
      .groupBy('category.id')
      .getRawMany();

    // 2. Projection data: Upcoming interest from payment_schedules
    // We get all unpaid schedules to project future cash flow
    const rawProjections = await schedulesRepo
      .createQueryBuilder('schedule')
      .leftJoin('schedule.investment', 'investment')
      .select('schedule.dueDate', 'date')
      .addSelect('SUM(schedule.amount)', 'amount')
      .where('investment.userId = :userId', { userId })
      .andWhere('schedule.status = :status', {
        status: PaymentScheduleStatus.UNPAID,
      })
      .groupBy('schedule.dueDate')
      .orderBy('schedule.dueDate', 'ASC')
      .getRawMany();

    // Process projections to group by month for a cleaner Area chart
    const monthlyProjectionMap = new Map<string, number>();
    for (const row of rawProjections) {
      const date = new Date(row.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyProjectionMap.get(monthKey) ?? 0;
      monthlyProjectionMap.set(monthKey, current + Number(row.amount));
    }

    const projection = Array.from(monthlyProjectionMap.entries()).map(
      ([date, amount]) => ({
        date,
        amount,
      }),
    );

    return {
      allocation: allocation.map((row) => ({
        category: row.category ?? 'Khác',
        value: Number(row.value),
      })),
      projection,
    };
  }

  private roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
