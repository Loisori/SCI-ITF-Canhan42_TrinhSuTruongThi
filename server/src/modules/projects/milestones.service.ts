import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { ProjectEntity, ProjectStatus } from './entities/project.entity';
import {
  ProjectMilestoneEntity,
  MilestoneStatus,
} from './entities/milestone.entity';
import { MilestoneDiscussionEntity } from './entities/discussion.entity';
import {
  InvestmentEntity,
  InvestmentStatus,
} from '../investments/entities/investment.entity';
import {
  TransactionEntity,
  TransactionStatus,
  TransactionType,
} from '../transactions/entities/transaction.entity';
import { UserEntity } from '../users/entities/user.entity';
import { NotificationType } from '../notifications/entities/notification.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications/notifications.service';
import { FinancialCalculator } from '../../common/utils/financial-calculator';

@Injectable()
export class MilestonesService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(MilestoneDiscussionEntity)
    private readonly milestoneDiscussionRepository: Repository<MilestoneDiscussionEntity>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getPendingMilestones() {
    const milestoneRepo = this.dataSource.getRepository(ProjectMilestoneEntity);
    const milestones = await milestoneRepo.find({
      where: { status: MilestoneStatus.ADMIN_REVIEW },
      relations: ['project', 'project.owner'],
      order: { createdAt: 'ASC' },
    });

    return milestones.map((m) => ({
      id: m.id,
      projectId: m.projectId,
      title: m.title,
      percentage: m.percentage,
      stage: m.stage,
      status: m.status,
      evidenceUrls: m.evidenceUrls,
      rejectionReason: m.rejectionReason,
      createdAt: m.createdAt,
      project: m.project
        ? {
            title: m.project.title,
            owner: m.project.owner
              ? {
                  fullName: m.project.owner.fullName,
                  email: m.project.owner.email,
                }
              : null,
          }
        : null,
    }));
  }

  async getDisputedMilestones() {
    const milestoneRepo = this.dataSource.getRepository(ProjectMilestoneEntity);
    return milestoneRepo.find({
      where: [
        { status: MilestoneStatus.DISPUTED },
        { status: MilestoneStatus.ADMIN_REVIEW },
      ],
      relations: ['project', 'project.owner'],
      order: { createdAt: 'DESC' },
    });
  }

  async uploadMilestoneProof(
    projectId: number,
    milestoneId: number,
    ownerId: number,
    evidenceUrls: string[],
  ) {
    const milestoneRepo = this.dataSource.getRepository(ProjectMilestoneEntity);
    const milestone = await milestoneRepo.findOne({
      where: { id: milestoneId, projectId },
    });

    if (!milestone) throw new NotFoundException('Milestone not found');

    const project = await this.projectRepo.findOne({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== ownerId) {
      throw new ForbiddenException('Only project owner can upload proof');
    }

    const isPendingButPastInterval =
      milestone.status === MilestoneStatus.PENDING &&
      milestone.nextDisbursementDate &&
      new Date() >= new Date(milestone.nextDisbursementDate);

    if (
      milestone.status !== MilestoneStatus.UPLOADING_PROOF &&
      !isPendingButPastInterval
    ) {
      throw new BadRequestException(
        'Không thể cập nhật bằng chứng ở giai đoạn này.',
      );
    }

    milestone.evidenceUrls = evidenceUrls;
    milestone.status = MilestoneStatus.ADMIN_REVIEW;
    await milestoneRepo.save(milestone);

    return milestone;
  }

  async createOrUpdateMilestones(
    projectId: number,
    ownerId: number,
    milestonesData: { title: string; percentage: number; stage: number }[],
  ) {
    return this.dataSource.transaction(async (manager) => {
      const milestoneRepo = manager.getRepository(ProjectMilestoneEntity);
      const projectRepo = manager.getRepository(ProjectEntity);

      const project = await projectRepo.findOne({
        where: { id: projectId, ownerId },
      });
      if (!project) throw new NotFoundException('Project not found');
      if (
        project.status !== ProjectStatus.PENDING &&
        project.status !== ProjectStatus.FUNDING
      ) {
        throw new BadRequestException(
          'Cannot update milestones after funding ends',
        );
      }

      if (!milestonesData || milestonesData.length === 0) {
        throw new BadRequestException('Milestones data is required.');
      }

      let totalPercentage = 0;
      for (const milestone of milestonesData) {
        const percent = Number(milestone.percentage);
        if (!Number.isFinite(percent) || percent <= 0) {
          throw new BadRequestException(
            'Milestone percentage must be a positive number.',
          );
        }
        totalPercentage += percent;
      }

      if (FinancialCalculator.round(totalPercentage) !== 100) {
        throw new BadRequestException(
          'Tổng phần trăm milestone phải bằng 100%.',
        );
      }

      await milestoneRepo.delete({ projectId });

      const entities = milestonesData.map((m) =>
        milestoneRepo.create({
          projectId,
          title: m.title,
          percentage: m.percentage,
          stage: m.stage,
          status: MilestoneStatus.PENDING,
        }),
      );

      return milestoneRepo.save(entities);
    });
  }

  async disburseMilestoneFunds(projectId: number, milestoneId: number) {
    const eventData = await this.dataSource.transaction(async (manager) => {
      const milestoneRepo = manager.getRepository(ProjectMilestoneEntity);
      const projectRepo = manager.getRepository(ProjectEntity);
      const usersRepo = manager.getRepository(UserEntity);
      const transactionRepo = manager.getRepository(TransactionEntity);

      const milestone = await milestoneRepo.findOne({
        where: { id: milestoneId, projectId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!milestone) throw new NotFoundException('Milestone not found');
      if (
        milestone.status !== MilestoneStatus.ADMIN_REVIEW &&
        milestone.status !== MilestoneStatus.VOTING
      ) {
        throw new BadRequestException(
          'Milestone is not eligible for disbursement.',
        );
      }

      const project = await projectRepo.findOne({
        where: { id: projectId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!project) throw new NotFoundException('Project not found');

      const existingDisbursement = await transactionRepo.findOne({
        where: {
          type: TransactionType.DISBURSEMENT,
          referenceId: milestone.id,
        },
      });
      if (existingDisbursement) {
        throw new BadRequestException('Milestone already disbursed.');
      }

      const totalRaised = Number(project.currentAmount);
      const upfrontFeeTx = await transactionRepo.findOne({
        where: {
          type: TransactionType.SYSTEM_FEE,
          referenceId: project.id,
          parentTransactionId: IsNull(),
          status: TransactionStatus.SUCCESS,
        },
      });

      const feeRate = FinancialCalculator.toCommissionFraction(
        project.commissionRate,
      );
      const upfrontFeeAmount = upfrontFeeTx ? Number(upfrontFeeTx.amount) : 0;

      if (feeRate > 0 && !upfrontFeeTx) {
        throw new BadRequestException(
          'Platform fee has not been collected for this project.',
        );
      }

      const netPool = FinancialCalculator.round(totalRaised - upfrontFeeAmount);
      if (netPool < 0) {
        throw new BadRequestException('Net disbursement pool is invalid.');
      }

      const nextMilestone = await milestoneRepo.findOne({
        where: { projectId: project.id, stage: milestone.stage + 1 },
      });

      let netDisbursement = FinancialCalculator.round(
        netPool * (milestone.percentage / 100),
      );

      if (!nextMilestone) {
        const milestoneSummary = await milestoneRepo.find({
          where: { projectId: project.id },
          select: ['id', 'percentage'],
        });
        const totalPercentage = milestoneSummary.reduce(
          (sum, m) => sum + Number(m.percentage),
          0,
        );

        if (totalPercentage === 100) {
          const otherMilestoneIds = milestoneSummary
            .filter((m) => m.id !== milestone.id)
            .map((m) => m.id);

          let alreadyDisbursed = 0;
          if (otherMilestoneIds.length > 0) {
            const rawTotal = await transactionRepo
              .createQueryBuilder('tx')
              .select('SUM(tx.amount)', 'total')
              .where('tx.type = :type', {
                type: TransactionType.DISBURSEMENT,
              })
              .andWhere('tx.status = :status', {
                status: TransactionStatus.SUCCESS,
              })
              .andWhere('tx.referenceId IN (:...ids)', {
                ids: otherMilestoneIds,
              })
              .getRawOne<{ total: string | null }>();

            alreadyDisbursed = FinancialCalculator.round(
              Number(rawTotal?.total ?? 0),
            );
          }

          const remaining = FinancialCalculator.round(
            netPool - alreadyDisbursed,
          );
          if (remaining < 0) {
            throw new BadRequestException('Net pool already fully disbursed.');
          }
          netDisbursement = remaining;
        }
      }

      const owner = await usersRepo.findOne({
        where: { id: project.ownerId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!owner) throw new NotFoundException('Owner not found');

      if (netDisbursement > 0) {
        await manager
          .createQueryBuilder()
          .update(UserEntity)
          .set({ balance: () => 'balance + :amount' })
          .where('id = :id')
          .setParameters({ id: owner.id, amount: netDisbursement })
          .execute();

        const ownerTx = transactionRepo.create({
          userId: project.ownerId,
          amount: netDisbursement,
          type: TransactionType.DISBURSEMENT,
          status: TransactionStatus.SUCCESS,
          description: `Giải ngân đợt ${milestone.stage} dự án ${project.title}`,
          referenceId: milestone.id,
          parentTransactionId: null,
        });
        await transactionRepo.save(ownerTx);
      }

      // 1. Update status
      milestone.status = MilestoneStatus.DISBURSED;
      milestone.disbursementDate = new Date();
      await milestoneRepo.save(milestone);

      // 2. Unlock next milestone if exists
      if (nextMilestone) {
        const intervalDays = milestone.intervalDays || 0;
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + intervalDays);

        if (intervalDays > 0) {
          nextMilestone.status = MilestoneStatus.PENDING;
          nextMilestone.nextDisbursementDate = nextDate;
        } else {
          nextMilestone.status = MilestoneStatus.UPLOADING_PROOF;
          nextMilestone.nextDisbursementDate = null;
        }
        await milestoneRepo.save(nextMilestone);
      } else {
        project.status = ProjectStatus.COMPLETED;

        if (
          FinancialCalculator.toCommissionFraction(project.commissionRate) <= 0
        ) {
          const ownerCompletedCount = await projectRepo.count({
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

        project.totalDebt = FinancialCalculator.calculateTotalDebt(
          Number(project.currentAmount),
          project.interestRate,
          project.durationMonths,
          project.commissionRate,
        );
        await projectRepo.save(project);
      }

      return {
        status: 'success',
        amount: netDisbursement,
        projectId: project.id,
        milestoneId: milestone.id,
        title: milestone.title,
        ownerId: project.ownerId,
        projectTitle: project.title,
        stage: milestone.stage,
      };
    });

    if (eventData.status === 'success') {
      this.eventEmitter.emit('milestone.completed', {
        projectId: eventData.projectId,
        milestoneId: eventData.milestoneId,
        amount: eventData.amount,
        title: eventData.title,
        ownerId: eventData.ownerId,
        projectTitle: eventData.projectTitle,
        stage: eventData.stage,
      });

      await this.notificationsService.createSpecialNotification(
        eventData.ownerId,
        `Giải ngân thành công! Giai đoạn ${eventData.stage} của dự án ${eventData.projectTitle} đã hoàn tất. Số tiền ${eventData.amount.toLocaleString('vi-VN')} ₫ đã được cộng vào ví của bạn.`,
        NotificationType.PAYMENT_SUCCESS,
      );
    }

    return eventData;
  }

  async adminMilestoneFeedback(
    milestoneId: number,
    adminId: number,
    content: string,
  ) {
    const milestoneRepo = this.dataSource.getRepository(ProjectMilestoneEntity);
    const milestone = await milestoneRepo.findOne({
      where: { id: milestoneId },
      relations: ['project'],
    });
    if (!milestone) throw new NotFoundException('Milestone not found');

    const discussion = this.milestoneDiscussionRepository.create({
      milestoneId,
      senderId: adminId,
      content,
    });
    await this.milestoneDiscussionRepository.save(discussion);

    milestone.status = MilestoneStatus.ADMIN_REVIEW;
    await milestoneRepo.save(milestone);

    await this.notificationsService.createSpecialNotification(
      milestone.project.ownerId,
      `Admin đã gửi phản hồi về Milestone: ${milestone.title}`,
      NotificationType.SYSTEM,
    );

    return { message: 'Feedback sent' };
  }

  async ownerMilestoneResponse(
    milestoneId: number,
    ownerId: number,
    content: string,
  ) {
    const milestoneRepo = this.dataSource.getRepository(ProjectMilestoneEntity);
    const milestone = await milestoneRepo.findOne({
      where: { id: milestoneId },
      relations: ['project'],
    });
    if (!milestone) throw new NotFoundException('Milestone not found');
    if (milestone.project.ownerId !== ownerId)
      throw new ForbiddenException('Not your project');

    const discussion = this.milestoneDiscussionRepository.create({
      milestoneId,
      senderId: ownerId,
      content,
    });
    await this.milestoneDiscussionRepository.save(discussion);

    return { message: 'Response sent' };
  }

  async getMilestoneDiscussions(milestoneId: number) {
    return this.milestoneDiscussionRepository.find({
      where: { milestoneId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
  }

  async rejectMilestone(
    projectId: number,
    milestoneId: number,
    reason: string,
  ) {
    const milestoneRepo = this.dataSource.getRepository(ProjectMilestoneEntity);
    const milestone = await milestoneRepo.findOne({
      where: { id: milestoneId, projectId },
    });
    if (!milestone) throw new NotFoundException('Milestone not found');

    milestone.status = MilestoneStatus.UPLOADING_PROOF; // Back to uploading
    milestone.rejectionReason = reason;
    await milestoneRepo.save(milestone);

    return { message: 'Milestone rejected/returned for proof' };
  }

  async adminTerminateProject(
    projectId: number,
    adminId: number,
    reason: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const projectRepo = manager.getRepository(ProjectEntity);
      const milestoneRepo = manager.getRepository(ProjectMilestoneEntity);
      const investmentRepo = manager.getRepository(InvestmentEntity);
      const userRepo = manager.getRepository(UserEntity);
      const transactionRepo = manager.getRepository(TransactionEntity);

      const project = await projectRepo.findOne({ where: { id: projectId } });
      if (!project) throw new NotFoundException('Project not found');

      // 1. Calculate Remaining Balance
      const milestones = await milestoneRepo.find({
        where: { projectId: project.id },
      });
      const completedMilestones = milestones.filter(
        (m) =>
          m.status === MilestoneStatus.COMPLETED ||
          m.status === MilestoneStatus.DISBURSED,
      );
      const totalPercentageDisbursed = completedMilestones.reduce(
        (sum, m) => sum + Number(m.percentage),
        0,
      );
      const remainingPercentage = 100 - totalPercentageDisbursed;

      const totalRaised = Number(project.currentAmount);
      const remainingBalanceToRefund = Number(
        (totalRaised * (remainingPercentage / 100)).toFixed(2),
      );

      // 2. Refund Investors
      const investments = await investmentRepo.find({
        where: { projectId: project.id, status: InvestmentStatus.ACTIVE },
      });

      let totalRefunded = 0;
      const lastIndex = investments.length - 1;

      for (let index = 0; index < investments.length; index += 1) {
        const inv = investments[index];
        const initialAmount = Number(inv.amount);
        const baseRefund =
          totalRaised > 0
            ? (initialAmount / totalRaised) * remainingBalanceToRefund
            : 0;
        const refundAmount =
          index === lastIndex
            ? FinancialCalculator.round(
                remainingBalanceToRefund - totalRefunded,
              )
            : FinancialCalculator.round(baseRefund);
        totalRefunded = FinancialCalculator.round(totalRefunded + refundAmount);

        if (refundAmount > 0) {
          const investor = await userRepo.findOne({
            where: { id: inv.userId },
            lock: { mode: 'pessimistic_write' },
          });
          if (investor) {
            investor.balance = Number(investor.balance) + refundAmount;
            await userRepo.save(investor);

            const tx = transactionRepo.create({
              userId: inv.userId,
              amount: refundAmount,
              type: TransactionType.REFUND,
              status: TransactionStatus.SUCCESS,
              description: `Hoàn tiền dự án ${project.title} (Hủy dự án)`,
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

      const disputedMilestone = milestones.find(
        (m) =>
          m.status === MilestoneStatus.DISPUTED ||
          m.status === MilestoneStatus.ADMIN_REVIEW,
      );
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

      return {
        remainingBalance: remainingBalanceToRefund,
        refundCount: investments.length,
      };
    });
  }
}
