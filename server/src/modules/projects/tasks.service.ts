import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThanOrEqual, Repository } from 'typeorm';
import { ProjectEntity, ProjectStatus } from './entities/project.entity';
import { InvestmentEntity, InvestmentStatus } from '../investments/entities/investment.entity';
import { UserEntity } from '../users/entities/user.entity';
import { TransactionEntity, TransactionStatus, TransactionType } from '../transactions/entities/transaction.entity';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectsRepository: Repository<ProjectEntity>,
    private readonly dataSource: DataSource,
  ) {}

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

      for (const inv of investments) {
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

      // Finalize project status
      project.status = ProjectStatus.FAILED;
      await projectsRepo.save(project);
    });
  }
}
