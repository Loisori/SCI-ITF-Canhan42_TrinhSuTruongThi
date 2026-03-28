import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
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
import { UserEntity } from '../users/entities/user.entity';
import {
  TransactionEntity,
  TransactionStatus,
  TransactionType,
} from '../transactions/entities/transaction.entity';
import { CreateInvestmentDto } from './dto/create-investment.dto';

@Injectable()
export class InvestmentsService {
  constructor(private readonly dataSource: DataSource) {}

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

      if (Number(project.currentAmount) >= Number(project.goalAmount)) {
        project.status = ProjectStatus.ACTIVE;
      }

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
      const now = new Date();

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

      return {
        message: 'Đầu tư thành công.',
        investmentId: savedInvestment.id,
        userBalance: user.balance,
        projectCurrentAmount: project.currentAmount,
        paymentScheduleCount: schedules.length,
      };
    });
  }

  private roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
