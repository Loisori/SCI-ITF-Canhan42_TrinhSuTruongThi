import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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

    return { message: 'Proof uploaded successfully', status: milestone.status };
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
      const investmentRepo = manager.getRepository(InvestmentEntity);
      const usersRepo = manager.getRepository(UserEntity);
      const transactionRepo = manager.getRepository(TransactionEntity);

      const milestone = await milestoneRepo.findOne({
        where: { id: milestoneId, projectId },
      });
      if (!milestone) throw new NotFoundException('Milestone not found');

      const project = await projectRepo.findOne({
        where: { id: projectId },
      });
      if (!project) throw new NotFoundException('Project not found');

      const totalInvested = Number(project.currentAmount);
      const commissionAmount = FinancialCalculator.calculateCommission(
        totalInvested,
        project.commissionRate,
      );
      const netReceived = totalInvested - commissionAmount;

      const disbursementAmount = FinancialCalculator.round(
        netReceived * (milestone.percentage / 100),
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
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + (milestone.intervalDays || 0));

        nextMilestone.status = MilestoneStatus.PENDING;
        nextMilestone.nextDisbursementDate = nextDate;
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
        (m) => m.status === MilestoneStatus.COMPLETED,
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

      for (const inv of investments) {
        const initialAmount = Number(inv.amount);
        const refundAmount = Number(
          ((initialAmount / totalRaised) * remainingBalanceToRefund).toFixed(2),
        );

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
