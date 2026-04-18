import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThanOrEqual, Repository } from 'typeorm';
import { ProjectEntity, ProjectStatus } from './entities/project.entity';
import { InvestmentEntity, InvestmentStatus } from '../investments/entities/investment.entity';
import { UserEntity } from '../users/entities/user.entity';
import { TransactionEntity, TransactionStatus, TransactionType } from '../transactions/entities/transaction.entity';
import { PaymentScheduleEntity, PaymentScheduleStatus } from '../investments/entities/schedule.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectsRepository: Repository<ProjectEntity>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Runs every day at midnight to check for overdue payments.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkOverduePayments() {
    this.logger.log('Starting daily overdue payments check...');

    await this.dataSource.transaction(async (manager) => {
      const scheduleRepo = manager.getRepository(PaymentScheduleEntity);
      const projectRepo = manager.getRepository(ProjectEntity);

      // Find overdue unpaid schedules
      const overdueSchedules = await scheduleRepo.find({
        where: {
          status: PaymentScheduleStatus.UNPAID,
          dueDate: LessThanOrEqual(new Date()),
        },
        relations: ['investment', 'investment.project'],
      });

      const projectIdsToMark = new Set<number>();
      
      for (const schedule of overdueSchedules) {
        const project = schedule.investment.project;
        if (project && project.status !== ProjectStatus.OVERDUE) {
          projectIdsToMark.add(project.id);
        }
      }

      if (projectIdsToMark.size === 0) {
        this.logger.log('No overdue payments found.');
        return;
      }

      for (const projectId of Array.from(projectIdsToMark)) {
        const project = await projectRepo.findOne({ where: { id: projectId } });
        if (project) {
          project.status = ProjectStatus.OVERDUE;
          await projectRepo.save(project);
          this.logger.warn(`Project ${project.id} marked as OVERDUE.`);
          
          this.eventEmitter.emit('project.overdue', {
            projectId: project.id,
            ownerId: project.ownerId,
            title: project.title,
          });
        }
      }
    });
  }

  /**
   * Runs every hour to check for projects that failed to reach their goal by the deadline.
   * Performs 100% refund for those projects.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleFundingRefunds() {
    this.logger.log('Starting hourly funding refund check...');

    const failedProjects = await this.projectsRepository.find({
      where: {
        status: ProjectStatus.FUNDING,
        endDate: LessThanOrEqual(new Date()),
      },
    });

    const trulyFailed = failedProjects.filter(
      (p) => Number(p.currentAmount) < Number(p.goalAmount),
    );

    if (trulyFailed.length === 0) {
      this.logger.log('No failed projects found.');
      return;
    }

    this.logger.log(`Found ${trulyFailed.length} failed projects. Starting refunds...`);

    for (const project of trulyFailed) {
      try {
        await this.refundProject(project.id);
        this.logger.log(`Successfully refunded project: ${project.title} (ID: ${project.id})`);
      } catch (error) {
        this.logger.error(`Failed to refund project ${project.id}: ${error.message}`);
      }
    }
  }

  private async refundProject(projectId: number) {
    await this.dataSource.transaction(async (manager) => {
      const projectsRepo = manager.getRepository(ProjectEntity);
      const investmentsRepo = manager.getRepository(InvestmentEntity);
      const transactionsRepo = manager.getRepository(TransactionEntity);

      const project = await projectsRepo.findOne({
        where: { id: projectId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!project || project.status !== ProjectStatus.FUNDING) return;

      const investments = await investmentsRepo.find({
        where: { 
          projectId, 
          status: InvestmentStatus.ACTIVE 
        },
      });

      const chunkSize = 100;
      for (let i = 0; i < investments.length; i += chunkSize) {
        const chunk = investments.slice(i, i + chunkSize);

        for (const inv of chunk) {
          const refundAmount = Number(inv.amount);
          if (refundAmount <= 0) continue;

          // Atomic SQL update for investor balance
          await manager.createQueryBuilder()
            .update(UserEntity)
            .set({ balance: () => `balance + :amount` })
            .where("id = :id")
            .setParameters({ id: inv.userId, amount: refundAmount })
            .execute();

          // Create refund transaction
          const refundTx = transactionsRepo.create({
            userId: inv.userId,
            amount: refundAmount,
            type: TransactionType.REFUND,
            status: TransactionStatus.SUCCESS,
            description: `Hoàn tiền 100% dự án ${project.title} do không đạt mục tiêu huy động.`,
            referenceId: project.id,
          });
          await transactionsRepo.save(refundTx);

          // Update investment status
          inv.status = InvestmentStatus.WITHDRAWN;
          await manager.save(inv);
        }
      }

      // Finalize project status
      project.status = ProjectStatus.FAILED;
      await projectsRepo.save(project);
    });
  }
}
