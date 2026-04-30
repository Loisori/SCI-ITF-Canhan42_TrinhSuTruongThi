import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  TransactionEntity,
  TransactionStatus,
  TransactionType,
} from './entities/transaction.entity';
import { UserEntity } from '../users/entities/user.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionsRepository: Repository<TransactionEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getMyTransactions(
    userId: number,
    filters?: { type?: string; status?: string },
  ) {
    const query = this.transactionsRepository
      .createQueryBuilder('tx')
      .where('tx.userId = :userId', { userId });

    if (filters?.type) {
      query.andWhere('tx.type = :type', { type: filters.type });
    }

    if (filters?.status) {
      query.andWhere('tx.status = :status', { status: filters.status });
    }

    const transactions = await query.orderBy('tx.createdAt', 'DESC').getMany();

    return transactions.map((transaction) => ({
      id: transaction.id,
      amount: Number(transaction.amount),
      type: transaction.type,
      status: transaction.status,
      description: transaction.description,
      referenceId: transaction.referenceId,
      createdAt: transaction.createdAt,
    }));
  }

  async createWithdrawRequest(userId: number, amount: number) {
    try {
      const numAmount = Number(amount);
      const user = await this.usersRepository.findOne({
        where: { id: userId },
      });
      if (!user) throw new NotFoundException('User not found');

      console.log(
        `[TransactionsService] Withdrawal create. User: ${user.fullName}, Balance: ${user.balance}, Type: ${typeof user.balance}, Requested: ${numAmount}`,
      );

      const userBalance = Number(user.balance);
      if (userBalance < numAmount) {
        console.log(
          `[TransactionsService] Insufficient balance. Balance: ${userBalance}, Requested: ${numAmount}`,
        );
        throw new BadRequestException(
          'Số dư không đủ để thực hiện yêu cầu rút tiền',
        );
      }

      const transaction = this.transactionsRepository.create({
        userId,
        amount: numAmount,
        type: TransactionType.WITHDRAWAL,
        status: TransactionStatus.PENDING,
        description: 'Yêu cầu rút tiền từ ví',
      });

      const savedTx = await this.transactionsRepository.save(transaction);
      console.log(
        `[TransactionsService] Withdrawal request saved. ID: ${savedTx.id}`,
      );
      return savedTx;
    } catch (error: any) {
      console.error(`[TransactionsService] Withdrawal error:`, error.message);
      // Re-throw if it's already a Nest exception, otherwise wrap in BadRequest
      if (error.status) throw error;
      throw new BadRequestException(
        `Không thể thực hiện yêu cầu rút tiền: ${error.message}`,
      );
    }
  }

  async getAllPendingWithdrawals() {
    return this.transactionsRepository.find({
      where: {
        type: TransactionType.WITHDRAWAL,
        status: TransactionStatus.PENDING,
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async approveWithdraw(
    adminId: number,
    transactionId: number,
    action: 'approve' | 'reject',
  ) {
    try {
      const finalizedTx = await this.dataSource.transaction(async (manager) => {
        const transactionRepo = manager.getRepository(TransactionEntity);
        const userRepo = manager.getRepository(UserEntity);

        const transaction = await transactionRepo.findOne({
          where: { id: transactionId },
          relations: ['user'],
          lock: { mode: 'pessimistic_write' },
        });

        if (!transaction) throw new NotFoundException('Transaction not found');
        if (transaction.status !== TransactionStatus.PENDING) {
          throw new BadRequestException('Giao dịch này đã được xử lý');
        }

        console.log(
          `[TransactionsService] Admin ${adminId} ${action} withdrawal ${transactionId}. Amount: ${transaction.amount}`,
        );

        if (action === 'approve') {
          const user = await userRepo.findOne({
            where: { id: transaction.userId },
            lock: { mode: 'pessimistic_write' },
          });

          if (!user) throw new NotFoundException('User not found');

          const userBalance = Number(user.balance);
          const txAmount = Number(transaction.amount);

          if (userBalance < txAmount) {
            transaction.status = TransactionStatus.FAILED;
            transaction.description =
              'Từ chối: Số dư không đủ tại thời điểm xử lý';
            await transactionRepo.save(transaction);
            throw new BadRequestException('Số dư người dùng không đủ');
          }

          await manager
            .createQueryBuilder()
            .update(UserEntity)
            .set({ balance: () => 'balance - :amount' })
            .where('id = :id')
            .setParameters({ id: user.id, amount: txAmount })
            .execute();

          transaction.status = TransactionStatus.SUCCESS;
          transaction.description = 'Rút tiền thành công';
        } else {
          transaction.status = TransactionStatus.FAILED;
          transaction.description = 'Yêu cầu rút tiền bị từ chối bởi Admin';
        }

        return transactionRepo.save(transaction);
      });

      console.log(
        `[TransactionsService] Withdrawal finalized with status: ${finalizedTx.status}`,
      );
      return finalizedTx;
    } catch (error: any) {
      console.error(
        `[TransactionsService] Withdrawal approve error:`,
        error.message,
      );
      if (error.status) throw error;
      throw new BadRequestException(
        `Không thể xử lý yêu cầu rút tiền: ${error.message}`,
      );
    }
  }
}
