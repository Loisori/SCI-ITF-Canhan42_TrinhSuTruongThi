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
import { ProjectMilestoneEntity, MilestoneStatus } from '../projects/entities/milestone.entity';
import { UserEntity } from '../users/entities/user.entity';
import {
  TransactionEntity,
  TransactionStatus,
  TransactionType,
} from '../transactions/entities/transaction.entity';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class InvestmentsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
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

  async invest(userId: number, dto: CreateInvestmentDto) {
    return this.dataSource.transaction(async (manager) => {
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
      if (project.endDate && new Date(project.endDate).getTime() < now.getTime()) {
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

        schedules.push(
          schedulesRepo.create({
            investmentId: savedInvestment.id,
            dueDate,
            amount: monthlyInterest,
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

      // Notify owner
      await this.notificationsService.createSpecialNotification(
        project.ownerId,
        `Có người vừa đầu tư ${amount.toLocaleString('vi-VN')} ₫ vào dự án ${project.title} của bạn.`,
        NotificationType.INVESTMENT_RECEIVED
      );

      // Check if project reached 100%
      if (Number(project.currentAmount) >= Number(project.goalAmount)) {
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
        message: 'Đầu tư thành công.',
        investmentId: savedInvestment.id,
        userBalance: user.balance,
        projectCurrentAmount: project.currentAmount,
        paymentScheduleCount: schedules.length,
      };
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
          const milestonesRepo = txManager.getRepository(ProjectMilestoneEntity);
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
            where: { id: project.ownerId },
            lock: { mode: 'pessimistic_write' },
          });

          if (owner && firstDisbursement > 0) {
            owner.balance = Number(owner.balance) + firstDisbursement;
            await usersRepo.save(owner);

            const ownerTx = transactionsRepo.create({
              userId: project.ownerId,
              amount: firstDisbursement,
              type: TransactionType.WITHDRAW,
              status: TransactionStatus.SUCCESS,
              description: `Nhận vốn đợt 1 dự án ${project.title}`,
              referenceId: project.id,
            });
            await transactionsRepo.save(ownerTx);
          }

          // Trả lãi (ROI) cho từng Investor: tạo transactions interest_receive + cập nhật payment_schedules thành paid.
          const nowPaid = new Date();
          const interestByInvestor = new Map<number, number>();
          const schedulesToUpdate: PaymentScheduleEntity[] = [];

          for (const inv of interestSourceInvestments) {
            const unpaidSchedules = (inv.paymentSchedules ?? []).filter(
              (s) => s.status === PaymentScheduleStatus.UNPAID,
            );

            const totalInterest = unpaidSchedules.reduce(
              (sum, s) => sum + Number(s.amount),
              0,
            );

            if (totalInterest > 0) {
              interestByInvestor.set(
                inv.userId,
                (interestByInvestor.get(inv.userId) ?? 0) + totalInterest,
              );
            }

            for (const s of unpaidSchedules) {
              s.status = PaymentScheduleStatus.PAID;
              s.paidAt = nowPaid;
              schedulesToUpdate.push(s);
            }
          }

          if (schedulesToUpdate.length > 0) {
            await txManager.getRepository(PaymentScheduleEntity).save(
              schedulesToUpdate,
            );
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

          // Notify investor about refund
          await this.notificationsService.createSpecialNotification(
            investment.userId,
            `Dự án ${project.title} không đạt mục tiêu và đã bị hủy. ${amount.toLocaleString('vi-VN')} ₫ đã được hoàn vào ví của bạn.`,
            NotificationType.PROJECT_UPDATE
          );

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
            proofUrl: m.proofUrl,
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

  private roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
