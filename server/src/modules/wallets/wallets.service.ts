import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  TransactionEntity,
  TransactionStatus,
  TransactionType,
} from '../transactions/entities/transaction.entity';
import { UserEntity, UserRole } from '../users/entities/user.entity';
import { InvestmentEntity } from '../investments/entities/investment.entity';
import {
  PaymentScheduleEntity,
  PaymentScheduleStatus,
} from '../investments/entities/schedule.entity';
import { ProjectEntity } from '../projects/entities/project.entity';

@Injectable()
export class WalletsService {
  constructor(private readonly dataSource: DataSource) {}

  async requestDeposit(userId: number, amount: number) {
    const transactionRepo = this.dataSource.getRepository(TransactionEntity);
    const transaction = transactionRepo.create({
      userId,
      amount,
      type: TransactionType.DEPOSIT,
      status: TransactionStatus.PENDING,
      description: 'Yêu cầu nạp tiền vào ví',
    });
    return transactionRepo.save(transaction);
  }

  async requestWithdrawal(userId: number, amount: number, bankName: string, accountNumber: string) {
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(UserEntity);
      const transactionRepo = manager.getRepository(TransactionEntity);

      const user = await userRepo.findOne({
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) throw new NotFoundException('User not found');
      if (Number(user.balance) < amount) {
        throw new BadRequestException('Số dư khả dụng không đủ để thực hiện rút tiền.');
      }

      // Deduct immediately to prevent over-drawing while pending
      user.balance = Number(user.balance) - amount;
      await userRepo.save(user);

      const transaction = transactionRepo.create({
        userId,
        amount,
        type: TransactionType.WITHDRAWAL,
        status: TransactionStatus.PENDING,
        description: `Rút tiền về ${bankName} (${accountNumber})`,
        bankName,
        accountNumber,
      });
      return transactionRepo.save(transaction);
    });
  }


  async adminApproveTransaction(transactionId: number) {
    return this.dataSource.transaction(async (manager) => {
      const transactionRepo = manager.getRepository(TransactionEntity);
      const userRepo = manager.getRepository(UserEntity);

      const transaction = await transactionRepo.findOne({
        where: { id: transactionId },
        relations: ['user'],
      });

      if (!transaction) throw new NotFoundException('Transaction not found');
      if (transaction.status !== TransactionStatus.PENDING) {
        throw new BadRequestException('Chỉ có thể duyệt giao dịch đang chờ.');
      }

      if (transaction.type === TransactionType.DEPOSIT) {
        const user = await userRepo.findOne({
          where: { id: transaction.userId },
          lock: { mode: 'pessimistic_write' },
        });
        if (user) {
          user.balance = Number(user.balance) + Number(transaction.amount);
          await userRepo.save(user);
        }
      }

      transaction.status = TransactionStatus.SUCCESS;
      return transactionRepo.save(transaction);
    });
  }

  async adminRejectTransaction(transactionId: number, reason: string) {
    return this.dataSource.transaction(async (manager) => {
      const transactionRepo = manager.getRepository(TransactionEntity);
      const userRepo = manager.getRepository(UserEntity);

      const transaction = await transactionRepo.findOne({
        where: { id: transactionId },
      });

      if (!transaction) throw new NotFoundException('Transaction not found');
      if (transaction.status !== TransactionStatus.PENDING) {
        throw new BadRequestException('Chỉ có thể từ chối giao dịch đang chờ.');
      }

      // If withdrawal, refund the balance
      if (transaction.type === TransactionType.WITHDRAWAL) {
        const user = await userRepo.findOne({
          where: { id: transaction.userId },
          lock: { mode: 'pessimistic_write' },
        });
        if (user) {
          user.balance = Number(user.balance) + Number(transaction.amount);
          await userRepo.save(user);
        }
      }

      transaction.status = TransactionStatus.FAILED;
      transaction.description = `${transaction.description} (Thất bại: ${reason})`;
      return transactionRepo.save(transaction);
    });
  }

  /**
   * Logic Trả Lãi (The 106k Logic)
   * Owner trả tiền cho một Milestone Schedule. 
   * Hệ thống tìm tất cả PaymentSchedule (cùng đợt/cùng ngày) của các Investors trong dự án đó để trả.
   */
  async repayMilestoneInterest(ownerId: number, scheduleId: number) {
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(UserEntity);
      const scheduleRepo = manager.getRepository(PaymentScheduleEntity);
      const investmentRepo = manager.getRepository(InvestmentEntity);
      const projectRepo = manager.getRepository(ProjectEntity);
      const transactionRepo = manager.getRepository(TransactionEntity);

      // 1. Tìm schedule đại diện
      const targetSchedule = await scheduleRepo.findOne({
        where: { id: scheduleId },
        relations: ['investment', 'investment.project'],
      });

      if (!targetSchedule) throw new NotFoundException('Payment schedule not found');
      if (targetSchedule.investment.project.ownerId !== ownerId) {
        throw new ForbiddenException('Bạn không phải chủ dự án này.');
      }
      if (targetSchedule.status === PaymentScheduleStatus.PAID) {
        throw new BadRequestException('Kỳ hạn này đã được thanh toán.');
      }

      const projectId = targetSchedule.investment.projectId;
      const dueDate = targetSchedule.dueDate;

      // 2. Tìm tất cả UNPAID schedules của dự án này trong cùng ngày dueDate
      const allSchedulesToPay = await scheduleRepo.find({
        where: {
          dueDate,
          status: PaymentScheduleStatus.UNPAID,
          investment: { projectId: projectId },
        },
        relations: ['investment'],
      });

      const totalRepaymentAmount = allSchedulesToPay.reduce(
        (sum, s) => sum + Number(s.amount),
        0,
      );

      // 3. Kiểm tra số dư Owner
      const owner = await userRepo.findOne({
        where: { id: ownerId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!owner || Number(owner.balance) < totalRepaymentAmount) {
        throw new BadRequestException(
          `Vui lòng nạp thêm tiền để trả nợ. Cần: ${totalRepaymentAmount.toLocaleString('vi-VN')} ₫. Số dư hiện tại: ${owner?.balance.toLocaleString('vi-VN')} ₫.`,
        );
      }

      // 4. Bắt đầu trừ tiền Owner & Cộng tiền Investor
      owner.balance = Number(owner.balance) - totalRepaymentAmount;
      await userRepo.save(owner);

      const ownerRepaymentTx = transactionRepo.create({
        userId: ownerId,
        amount: totalRepaymentAmount,
        type: TransactionType.REPAYMENT,
        status: TransactionStatus.SUCCESS,
        description: `Thanh toán lãi kỳ ${dueDate} dự án ${targetSchedule.investment.project.title}`,
        referenceId: projectId,
      });
      const savedOwnerTx = await transactionRepo.save(ownerRepaymentTx);

      for (const s of allSchedulesToPay) {
        const investor = await userRepo.findOne({
          where: { id: s.investment.userId },
          lock: { mode: 'pessimistic_write' },
        });

        if (investor) {
          const amount = Number(s.amount);
          investor.balance = Number(investor.balance) + amount;
          await userRepo.save(investor);

          // Tạo transaction cho investor
          const investorTx = transactionRepo.create({
            userId: investor.id,
            amount: amount,
            type: TransactionType.INTEREST_RECEIVE,
            status: TransactionStatus.SUCCESS,
            description: `Nhận lãi kỳ ${dueDate} dự án ${targetSchedule.investment.project.title}`,
            referenceId: projectId,
            parentTransactionId: savedOwnerTx.id, // Linking to owner's batch repayment
          });
          await transactionRepo.save(investorTx);

          // Cập nhật trạng thái schedule
          s.status = PaymentScheduleStatus.PAID;
          s.paidAt = new Date();
          await scheduleRepo.save(s);
        }
      }

      return {
        message: 'Thanh toán thành công.',
        totalPaid: totalRepaymentAmount,
        investorCount: allSchedulesToPay.length,
      };
    });
  }

  async getTransactionHistory(userId: number) {
    return this.dataSource.getRepository(TransactionEntity).find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getPendingTransactions() {
    return this.dataSource.getRepository(TransactionEntity).find({
      where: { status: TransactionStatus.PENDING },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }


  /**
   * Fetch all unpaid schedules for an owner across all their projects
   */
  async getOwnerRepaymentSchedules(ownerId: number) {
    const scheduleRepo = this.dataSource.getRepository(PaymentScheduleEntity);
    
    // Using QueryBuilder for better control
    const schedules = await scheduleRepo.createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.investment', 'investment')
      .leftJoinAndSelect('investment.project', 'project')
      .where('project.ownerId = :ownerId', { ownerId })
      .andWhere('schedule.status = :status', { status: PaymentScheduleStatus.UNPAID })
      .orderBy('schedule.dueDate', 'ASC')
      .getMany();

    // Grouping by project and due date
    const groups = new Map<string, any>();

    for (const s of schedules) {
      const key = `${s.investment.projectId}_${s.dueDate}`;
      if (!groups.has(key)) {
        groups.set(key, {
          projectId: s.investment.projectId,
          projectTitle: s.investment.project.title,
          dueDate: s.dueDate,
          representativeScheduleId: s.id, // Entry point for repayMilestoneInterest
          totalAmount: 0,
          investorCount: 0,
        });
      }
      const group = groups.get(key);
      group.totalAmount += Number(s.amount);
      group.investorCount += 1;
    }

    return Array.from(groups.values());
  }
}

