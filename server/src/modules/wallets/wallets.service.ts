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

      // 4. Trừ tiền Owner ngay lập tức (Atomic)
      await manager.createQueryBuilder()
        .update(UserEntity)
        .set({ balance: () => "balance - :amount" })
        .where("id = :id", { id: userId, amount })
        .execute();

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
        // Cộng tiền - sử dụng Atomic SQL để tránh N+1 locks & race condition
        await manager.createQueryBuilder()
          .update(UserEntity)
          .set({ balance: () => "balance + :amount" })
          .where("id = :id", { id: transaction.userId, amount: transaction.amount })
          .execute();
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

      // If withdrawal, refund the balance (Atomic)
      if (transaction.type === TransactionType.WITHDRAWAL) {
        await manager.createQueryBuilder()
          .update(UserEntity)
          .set({ balance: () => "balance + :amount" })
          .where("id = :id", { id: transaction.userId, amount: transaction.amount })
          .execute();
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

      // 3. Tính tổng số tiền (Áp dụng "Integer First" để trị Penny Gap)
      // Nhân 100 để đưa về đơn vị nhỏ nhất (cents), sau đó mới cộng
      const totalCents = allSchedulesToPay.reduce(
        (sum, s) => sum + Math.round(Number(s.amount) * 100),
        0,
      );
      const totalRepaymentAmount = totalCents / 100;

      // 4. Kiểm tra & Trừ tiền Owner (Atomic)
      const owner = await userRepo.findOne({
        where: { id: ownerId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!owner || Number(owner.balance) < totalRepaymentAmount) {
        throw new BadRequestException(
          `Vui lòng nạp thêm tiền để trả nợ. Cần: ${totalRepaymentAmount.toLocaleString('vi-VN')} ₫.`,
        );
      }

      await manager.createQueryBuilder()
        .update(UserEntity)
        .set({ balance: () => "balance - :amount" })
        .where("id = :id", { id: ownerId, amount: totalRepaymentAmount })
        .execute();

      const ownerRepaymentTx = transactionRepo.create({
        userId: ownerId,
        amount: totalRepaymentAmount,
        type: TransactionType.REPAYMENT,
        status: TransactionStatus.SUCCESS,
        description: `Thanh toán lãi kỳ ${dueDate} dự án ${targetSchedule.investment.project.title}`,
        referenceId: projectId,
      });
      const savedOwnerTx = await transactionRepo.save(ownerRepaymentTx);

      // 5. Cộng tiền cho từng Investor (Atomic SQL - Hiệu năng cao)
      for (const s of allSchedulesToPay) {
        const investorId = s.investment.userId;
        const amount = Number(s.amount);

        // Update balance bằng SQL trực tiếp - TRIỆT TIÊU N+1 Locks
        await manager.createQueryBuilder()
          .update(UserEntity)
          .set({ balance: () => "balance + :amount" })
          .where("id = :id", { id: investorId, amount: amount })
          .execute();

        // Tạo transaction log cho investor
        const investorTx = transactionRepo.create({
          userId: investorId,
          amount: amount,
          type: TransactionType.INTEREST_RECEIVE,
          status: TransactionStatus.SUCCESS,
          description: `Nhận lãi kỳ ${dueDate} dự án ${targetSchedule.investment.project.title}`,
          referenceId: projectId,
          parentTransactionId: savedOwnerTx.id,
        });
        await transactionRepo.save(investorTx);

        // Cập nhật trạng thái schedule
        await manager.update(PaymentScheduleEntity, s.id, {
          status: PaymentScheduleStatus.PAID,
          paidAt: new Date(),
        });
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

