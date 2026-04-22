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
import { FinancialCalculator } from '../../common/utils/financial-calculator';
import { UserEntity, UserRole } from '../users/entities/user.entity';
import {
  InvestmentEntity,
  InvestmentStatus,
} from '../investments/entities/investment.entity';
import {
  PaymentScheduleEntity,
  PaymentScheduleStatus,
} from '../investments/entities/schedule.entity';
import {
  ProjectEntity,
  ProjectStatus,
} from '../projects/entities/project.entity';

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

  async requestWithdrawal(
    userId: number,
    amount: number,
    bankName: string,
    accountNumber: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(UserEntity);
      const transactionRepo = manager.getRepository(TransactionEntity);

      const user = await userRepo.findOne({
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) throw new NotFoundException('User not found');
      if (Number(user.balance) < amount) {
        throw new BadRequestException(
          'Số dư khả dụng không đủ để thực hiện rút tiền.',
        );
      }

      // Check if owner has OVERDUE projects
      const projectRepo = manager.getRepository(ProjectEntity);
      const overdueProjects = await projectRepo.count({
        where: { ownerId: userId, status: ProjectStatus.OVERDUE },
      });

      if (overdueProjects > 0) {
        throw new BadRequestException(
          'Tài khoản bị khóa chức năng rút tiền do có khoản nợ quá hạn.',
        );
      }

      // 4. Trừ tiền Owner ngay lập tức (Atomic)
      await manager
        .createQueryBuilder()
        .update(UserEntity)
        .set({ balance: () => 'balance - :amount' })
        .where('id = :id')
        .setParameters({ id: userId, amount })
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
        await manager
          .createQueryBuilder()
          .update(UserEntity)
          .set({ balance: () => 'balance + :amount' })
          .where('id = :id')
          .setParameters({ id: transaction.userId, amount: transaction.amount })
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
        await manager
          .createQueryBuilder()
          .update(UserEntity)
          .set({ balance: () => 'balance + :amount' })
          .where('id = :id')
          .setParameters({ id: transaction.userId, amount: transaction.amount })
          .execute();
      }

      transaction.status = TransactionStatus.FAILED;
      transaction.description = `${transaction.description} (Thất bại: ${reason})`;
      return transactionRepo.save(transaction);
    });
  }

  private async getOwnerFeeRate(ownerId: number): Promise<number> {
    const projectRepo = this.dataSource.getRepository(ProjectEntity);
    const successCount = await projectRepo.count({
      where: { ownerId, status: ProjectStatus.COMPLETED },
    });

    if (successCount >= 3) return 0.05; // 5%
    if (successCount >= 1) return 0.08; // 8%
    return 0.1; // 10%
  }

  private toCommissionFraction(commissionRate?: number | null): number {
    return FinancialCalculator.toCommissionFraction(commissionRate);
  }

  private async resolveProjectFeeRate(
    manager: EntityManager,
    project: ProjectEntity,
  ): Promise<number> {
    const configuredRate = this.toCommissionFraction(project.commissionRate);
    if (configuredRate > 0) {
      return configuredRate;
    }

    const tierRate = await this.getOwnerFeeRate(project.ownerId);

    // Persist a snapshot so all debt calculations for this project stay consistent.
    project.commissionRate = FinancialCalculator.round(tierRate * 100);
    await manager.save(project);

    return tierRate;
  }

  /**
   * Cơ chế trả nợ (Repayment Logic)
   * Chủ dự án trả nợ cho dự án. Hệ thống tự động trừ nợ và phân phối về ví Investor
   * theo tỷ lệ phần trăm đóng góp ban đầu (đã trừ phí sàn).
   */
  async repayProjectDebt(ownerId: number, projectId: number, amount: number) {
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(UserEntity);
      const projectRepo = manager.getRepository(ProjectEntity);
      const investmentRepo = manager.getRepository(InvestmentEntity);
      const scheduleRepo = manager.getRepository(PaymentScheduleEntity);
      const transactionRepo = manager.getRepository(TransactionEntity);

      const project = await projectRepo.findOne({
        where: { id: projectId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!project) throw new NotFoundException('Project not found');
      if (project.ownerId !== ownerId)
        throw new ForbiddenException('Bạn không phải chủ dự án này.');

      const totalDebt = Number(project.totalDebt);
      if (totalDebt <= 0)
        throw new BadRequestException(
          'Dự án này hiện không có nợ cần thanh toán.',
        );

      const repaymentAmount = Math.min(amount, totalDebt);
      const feeRate = await this.resolveProjectFeeRate(manager, project);

      const unpaidSchedules = await scheduleRepo.find({
        where: {
          status: PaymentScheduleStatus.UNPAID,
          investment: { projectId },
        },
        relations: ['investment'],
      });

      let outstandingInvestorDebt = totalDebt;
      if (unpaidSchedules.length > 0) {
        const investmentIds = Array.from(
          new Set(unpaidSchedules.map((s) => Number(s.investmentId))),
        );

        const maxDueDateRows =
          investmentIds.length > 0
            ? await scheduleRepo
                .createQueryBuilder('schedule')
                .select('schedule.investmentId', 'investmentId')
                .addSelect('MAX(schedule.dueDate)', 'maxDueDate')
                .where('schedule.investmentId IN (:...investmentIds)', {
                  investmentIds,
                })
                .groupBy('schedule.investmentId')
                .getRawMany<{
                  investmentId: string;
                  maxDueDate: string | Date;
                }>()
            : [];

        const maxDueDateByInvestment = new Map<number, string>();
        for (const row of maxDueDateRows) {
          maxDueDateByInvestment.set(
            Number(row.investmentId),
            this.normalizeDateKey(row.maxDueDate),
          );
        }

        outstandingInvestorDebt = FinancialCalculator.round(
          unpaidSchedules.reduce((sum, schedule) => {
            const grossAmount = Number(schedule.amount);
            const principal = Number(schedule.investment.amount || 0);
            const isFinalForInvestment =
              this.normalizeDateKey(schedule.dueDate) ===
              maxDueDateByInvestment.get(Number(schedule.investmentId));
            const hasEmbeddedPrincipal =
              isFinalForInvestment && grossAmount >= principal;

            const effectiveAmount =
              isFinalForInvestment && !hasEmbeddedPrincipal
                ? FinancialCalculator.round(grossAmount + principal)
                : grossAmount;

            return sum + effectiveAmount;
          }, 0),
        );
      }

      const outstandingFeeDebt = FinancialCalculator.round(
        Math.max(totalDebt - outstandingInvestorDebt, 0),
      );

      let feeAmount = 0;
      if (outstandingFeeDebt > 0 && totalDebt > 0) {
        feeAmount =
          repaymentAmount >= totalDebt
            ? outstandingFeeDebt
            : FinancialCalculator.round(
                repaymentAmount * (outstandingFeeDebt / totalDebt),
              );
        feeAmount = Math.min(feeAmount, repaymentAmount);
      }

      const investorPayoutPool = FinancialCalculator.round(
        repaymentAmount - feeAmount,
      );

      const owner = await userRepo.findOne({
        where: { id: ownerId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!owner || Number(owner.balance) < repaymentAmount) {
        throw new BadRequestException(
          `Số dư không đủ. Cần: ${repaymentAmount.toLocaleString('vi-VN')} ₫.`,
        );
      }

      await manager
        .createQueryBuilder()
        .update(UserEntity)
        .set({ balance: () => 'balance - :amount' })
        .where('id = :id')
        .setParameters({ id: ownerId, amount: repaymentAmount })
        .execute();

      project.totalDebt = FinancialCalculator.round(
        Math.max(totalDebt - repaymentAmount, 0),
      );
      await manager.save(project);

      const ownerRepaymentTx = transactionRepo.create({
        userId: ownerId,
        amount: repaymentAmount,
        type: TransactionType.REPAYMENT,
        status: TransactionStatus.SUCCESS,
        description: `Thanh toán nợ dự án ${project.title} (Phí sàn: ${(feeRate * 100).toFixed(0)}%)`,
        referenceId: projectId,
      });
      const savedOwnerTx = await transactionRepo.save(ownerRepaymentTx);

      const investments = await investmentRepo.find({
        where: {
          projectId,
          status: InvestmentStatus.ACTIVE,
        },
      });

      const totalPrincipal = investments.reduce(
        (sum, inv) => sum + Number(inv.amount),
        0,
      );

      if (totalPrincipal <= 0) {
        throw new BadRequestException(
          'Không tìm thấy dữ liệu vốn của nhà đầu tư để phân phối trả gốc.',
        );
      }

      let totalDistributed = 0;

      for (let index = 0; index < investments.length; index += 1) {
        const inv = investments[index];
        const remainingAmount = FinancialCalculator.round(
          investorPayoutPool - totalDistributed,
        );
        if (remainingAmount <= 0) break;

        let investorShare = 0;
        if (index === investments.length - 1) {
          investorShare = remainingAmount;
        } else {
          const share = Number(inv.amount) / totalPrincipal;
          investorShare = FinancialCalculator.round(investorPayoutPool * share);
          investorShare = Math.min(investorShare, remainingAmount);
        }

        if (investorShare <= 0) continue;

        totalDistributed = FinancialCalculator.round(
          totalDistributed + investorShare,
        );

        await manager
          .createQueryBuilder()
          .update(UserEntity)
          .set({ balance: () => 'balance + :amount' })
          .where('id = :id')
          .setParameters({ id: inv.userId, amount: investorShare })
          .execute();

        const investorTx = transactionRepo.create({
          userId: inv.userId,
          amount: investorShare,
          type: TransactionType.REPAYMENT,
          status: TransactionStatus.SUCCESS,
          description: `Nhận thanh toán nợ từ dự án ${project.title}`,
          referenceId: projectId,
          parentTransactionId: savedOwnerTx.id,
        });
        await transactionRepo.save(investorTx);
      }

      const ADMIN_PLATFORM_ID = 1;
      if (feeAmount > 0) {
        await manager
          .createQueryBuilder()
          .update(UserEntity)
          .set({ balance: () => 'balance + :amount' })
          .where('id = :id')
          .setParameters({ id: ADMIN_PLATFORM_ID, amount: feeAmount })
          .execute();

        const systemFeeTx = transactionRepo.create({
          userId: ADMIN_PLATFORM_ID,
          amount: feeAmount,
          type: TransactionType.SYSTEM_FEE,
          status: TransactionStatus.SUCCESS,
          description: `Phí sàn thanh toán nợ dự án ${project.title}`,
          referenceId: projectId,
          parentTransactionId: savedOwnerTx.id,
        });
        await transactionRepo.save(systemFeeTx);
      }

      return {
        message: 'Thanh toán nợ dự án thành công.',
        paidAmount: repaymentAmount,
        remainingDebt: project.totalDebt,
        feeAmount,
        distributedAmount: totalDistributed,
      };
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
      const projectRepo = manager.getRepository(ProjectEntity);
      const scheduleRepo = manager.getRepository(PaymentScheduleEntity);
      const transactionRepo = manager.getRepository(TransactionEntity);

      const targetSchedule = await scheduleRepo.findOne({
        where: { id: scheduleId },
        relations: ['investment', 'investment.project'],
      });

      if (!targetSchedule)
        throw new NotFoundException('Payment schedule not found');
      if (targetSchedule.investment.project.ownerId !== ownerId) {
        throw new ForbiddenException('Bạn không phải chủ dự án này.');
      }
      if (targetSchedule.status === PaymentScheduleStatus.PAID) {
        throw new BadRequestException('Kỳ hạn này đã được thanh toán.');
      }

      const project = await projectRepo.findOne({
        where: { id: targetSchedule.investment.project.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!project) throw new NotFoundException('Project not found');

      const projectId = project.id;
      const dueDate = targetSchedule.dueDate;

      const allSchedulesToPay = await scheduleRepo.find({
        where: {
          dueDate,
          status: PaymentScheduleStatus.UNPAID,
          investment: { projectId: projectId },
        },
        relations: ['investment'],
      });

      const investmentIds = Array.from(
        new Set(allSchedulesToPay.map((s) => Number(s.investmentId))),
      );

      const maxDueDateRows =
        investmentIds.length > 0
          ? await scheduleRepo
              .createQueryBuilder('schedule')
              .select('schedule.investmentId', 'investmentId')
              .addSelect('MAX(schedule.dueDate)', 'maxDueDate')
              .where('schedule.investmentId IN (:...investmentIds)', {
                investmentIds,
              })
              .groupBy('schedule.investmentId')
              .getRawMany<{ investmentId: string; maxDueDate: string | Date }>()
          : [];

      const maxDueDateByInvestment = new Map<number, string>();
      for (const row of maxDueDateRows) {
        maxDueDateByInvestment.set(
          Number(row.investmentId),
          this.normalizeDateKey(row.maxDueDate),
        );
      }

      const scheduleBreakdowns = allSchedulesToPay.map((schedule) => {
        const grossAmount = Number(schedule.amount);
        const investmentPrincipal = Number(schedule.investment.amount || 0);
        const isFinalForInvestment =
          this.normalizeDateKey(schedule.dueDate) ===
          maxDueDateByInvestment.get(Number(schedule.investmentId));

        // New data: final schedule already includes principal.
        // Legacy data: final schedule may still contain interest only.
        const hasEmbeddedPrincipal =
          isFinalForInvestment && grossAmount >= investmentPrincipal;

        const principalShare = isFinalForInvestment
          ? FinancialCalculator.round(
              hasEmbeddedPrincipal
                ? Math.min(investmentPrincipal, grossAmount)
                : investmentPrincipal,
            )
          : 0;

        const interestShare = FinancialCalculator.round(
          isFinalForInvestment
            ? hasEmbeddedPrincipal
              ? Math.max(grossAmount - principalShare, 0)
              : grossAmount
            : grossAmount,
        );

        return {
          schedule,
          principalShare,
          interestShare,
        };
      });

      const principalAmount = FinancialCalculator.round(
        scheduleBreakdowns.reduce((sum, item) => sum + item.principalShare, 0),
      );
      const interestAmount = FinancialCalculator.round(
        scheduleBreakdowns.reduce((sum, item) => sum + item.interestShare, 0),
      );
      const debtPaymentAmount = FinancialCalculator.round(
        principalAmount + interestAmount,
      );

      const feeRate = await this.resolveProjectFeeRate(manager, project);

      const totalUnpaidSchedulesInProject = await scheduleRepo.count({
        where: {
          status: PaymentScheduleStatus.UNPAID,
          investment: { projectId },
        },
      });
      const isFinalRepaymentBatch =
        totalUnpaidSchedulesInProject === allSchedulesToPay.length;

      // Platform fee is charged on interest only.
      let feeAmount = FinancialCalculator.round(interestAmount * feeRate);
      if (isFinalRepaymentBatch) {
        feeAmount = FinancialCalculator.round(
          Math.max(Number(project.totalDebt) - debtPaymentAmount, 0),
        );
      }

      const ownerChargeAmount = FinancialCalculator.round(
        debtPaymentAmount + feeAmount,
      );

      const owner = await userRepo.findOne({
        where: { id: ownerId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!owner || Number(owner.balance) < ownerChargeAmount) {
        throw new BadRequestException(
          `Vui lòng nạp thêm tiền để trả nợ. Cần: ${ownerChargeAmount.toLocaleString('vi-VN')} ₫.`,
        );
      }

      await manager
        .createQueryBuilder()
        .update(UserEntity)
        .set({ balance: () => 'balance - :amount' })
        .where('id = :id', { id: ownerId, amount: ownerChargeAmount })
        .execute();

      project.totalDebt = FinancialCalculator.round(
        Math.max(Number(project.totalDebt) - ownerChargeAmount, 0),
      );
      await manager.save(project);

      let ownerInterestTxId: number | null = null;
      let ownerPrincipalTxId: number | null = null;

      if (interestAmount > 0) {
        const ownerInterestTx = transactionRepo.create({
          userId: ownerId,
          amount: interestAmount,
          type: TransactionType.REPAY_INTEREST,
          status: TransactionStatus.SUCCESS,
          description: `Thanh toán lãi kỳ ${dueDate} dự án ${project.title} (Phí sàn: ${(feeRate * 100).toFixed(0)}%)`,
          referenceId: projectId,
        });
        const savedOwnerInterestTx =
          await transactionRepo.save(ownerInterestTx);
        ownerInterestTxId = savedOwnerInterestTx.id;
      }

      if (principalAmount > 0) {
        const ownerPrincipalTx = transactionRepo.create({
          userId: ownerId,
          amount: principalAmount,
          type: TransactionType.REPAY_PRINCIPAL,
          status: TransactionStatus.SUCCESS,
          description: `Thanh toán gốc kỳ cuối dự án ${project.title}`,
          referenceId: projectId,
        });
        const savedOwnerPrincipalTx =
          await transactionRepo.save(ownerPrincipalTx);
        ownerPrincipalTxId = savedOwnerPrincipalTx.id;
      }

      for (const item of scheduleBreakdowns) {
        const schedule = item.schedule;
        const investorId = schedule.investment.userId;
        const principalShare = item.principalShare;
        const interestShare = item.interestShare;

        const payoutAmount = FinancialCalculator.round(
          principalShare + interestShare,
        );

        if (payoutAmount > 0) {
          await manager
            .createQueryBuilder()
            .update(UserEntity)
            .set({ balance: () => 'balance + :amount' })
            .where('id = :id', { id: investorId, amount: payoutAmount })
            .execute();
        }

        if (principalShare > 0) {
          const investorPrincipalTx = transactionRepo.create({
            userId: investorId,
            amount: principalShare,
            type: TransactionType.REPAY_PRINCIPAL,
            status: TransactionStatus.SUCCESS,
            description: `Nhận hoàn gốc kỳ cuối dự án ${project.title}`,
            referenceId: projectId,
            parentTransactionId:
              ownerPrincipalTxId ?? ownerInterestTxId ?? undefined,
          });
          await transactionRepo.save(investorPrincipalTx);
        }

        if (interestShare > 0) {
          const investorInterestTx = transactionRepo.create({
            userId: investorId,
            amount: interestShare,
            type: TransactionType.INTEREST_RECEIVE,
            status: TransactionStatus.SUCCESS,
            description: `Nhận lãi kỳ ${dueDate} dự án ${project.title}`,
            referenceId: projectId,
            parentTransactionId:
              ownerInterestTxId ?? ownerPrincipalTxId ?? undefined,
          });
          await transactionRepo.save(investorInterestTx);
        }

        await manager.update(PaymentScheduleEntity, schedule.id, {
          status: PaymentScheduleStatus.PAID,
          paidAt: new Date(),
        });
      }

      const ADMIN_PLATFORM_ID = 1;
      const totalSystemRevenue = FinancialCalculator.round(
        Math.max(feeAmount, 0),
      );

      if (totalSystemRevenue > 0) {
        await manager
          .createQueryBuilder()
          .update(UserEntity)
          .set({ balance: () => 'balance + :amount' })
          .where('id = :id', {
            id: ADMIN_PLATFORM_ID,
            amount: totalSystemRevenue,
          })
          .execute();

        const systemFeeTx = transactionRepo.create({
          userId: ADMIN_PLATFORM_ID,
          amount: totalSystemRevenue,
          type: TransactionType.SYSTEM_FEE,
          status: TransactionStatus.SUCCESS,
          description: `Phí sàn trả lãi kỳ ${dueDate} dự án ${project.title}`,
          referenceId: projectId,
          parentTransactionId:
            ownerInterestTxId ?? ownerPrincipalTxId ?? undefined,
        });
        await transactionRepo.save(systemFeeTx);
      }

      return {
        message: 'Thanh toán thành công.',
        totalPaid: ownerChargeAmount,
        principalPaid: principalAmount,
        interestPaid: interestAmount,
        remainingDebt: Number(project.totalDebt),
        investorCount: allSchedulesToPay.length,
        feeAmount: totalSystemRevenue,
      };
    });
  }

  private normalizeDateKey(value: Date | string): string {
    if (typeof value === 'string') {
      return value.slice(0, 10);
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    const schedules = await scheduleRepo
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.investment', 'investment')
      .leftJoinAndSelect('investment.project', 'project')
      .where('project.ownerId = :ownerId', { ownerId })
      .andWhere('schedule.status = :status', {
        status: PaymentScheduleStatus.UNPAID,
      })
      .orderBy('schedule.dueDate', 'ASC')
      .getMany();

    const investmentIds = Array.from(
      new Set(schedules.map((s) => Number(s.investmentId))),
    );

    const maxDueDateRows =
      investmentIds.length > 0
        ? await scheduleRepo
            .createQueryBuilder('schedule')
            .select('schedule.investmentId', 'investmentId')
            .addSelect('MAX(schedule.dueDate)', 'maxDueDate')
            .where('schedule.investmentId IN (:...investmentIds)', {
              investmentIds,
            })
            .groupBy('schedule.investmentId')
            .getRawMany<{ investmentId: string; maxDueDate: string | Date }>()
        : [];

    const maxDueDateByInvestment = new Map<number, string>();
    for (const row of maxDueDateRows) {
      maxDueDateByInvestment.set(
        Number(row.investmentId),
        this.normalizeDateKey(row.maxDueDate),
      );
    }

    // Grouping by project and due date
    const groups = new Map<string, any>();
    const feeRateByProject = new Map<number, number>();

    for (const s of schedules) {
      const projectId = Number(s.investment.projectId);
      const grossAmount = Number(s.amount);
      const principal = Number(s.investment.amount || 0);
      const isFinalForInvestment =
        this.normalizeDateKey(s.dueDate) ===
        maxDueDateByInvestment.get(Number(s.investmentId));
      const hasEmbeddedPrincipal =
        isFinalForInvestment && grossAmount >= principal;

      const principalShare = isFinalForInvestment
        ? hasEmbeddedPrincipal
          ? Math.min(principal, grossAmount)
          : principal
        : 0;

      const interestShare = isFinalForInvestment
        ? hasEmbeddedPrincipal
          ? Math.max(grossAmount - principalShare, 0)
          : grossAmount
        : grossAmount;

      const effectiveAmount =
        isFinalForInvestment && !hasEmbeddedPrincipal
          ? FinancialCalculator.round(grossAmount + principal)
          : grossAmount;

      let feeRate = feeRateByProject.get(projectId);
      if (feeRate === undefined) {
        const configuredRate = this.toCommissionFraction(
          s.investment.project.commissionRate,
        );
        feeRate =
          configuredRate > 0
            ? configuredRate
            : await this.getOwnerFeeRate(ownerId);
        feeRateByProject.set(projectId, feeRate);
      }

      const feeAmount = FinancialCalculator.round(interestShare * feeRate);
      const ownerRepaymentAmount = FinancialCalculator.round(
        effectiveAmount + feeAmount,
      );

      const key = `${s.investment.projectId}_${s.dueDate}`;
      if (!groups.has(key)) {
        groups.set(key, {
          projectId,
          projectTitle: s.investment.project.title,
          dueDate: s.dueDate,
          representativeScheduleId: s.id, // Entry point for repayMilestoneInterest
          totalAmount: 0,
          investorCount: 0,
        });
      }
      const group = groups.get(key);
      group.totalAmount = FinancialCalculator.round(
        group.totalAmount + ownerRepaymentAmount,
      );
      group.investorCount += 1;
    }

    return Array.from(groups.values());
  }
}
