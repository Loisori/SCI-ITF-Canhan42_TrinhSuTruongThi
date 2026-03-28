import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEntity } from './entities/transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionsRepository: Repository<TransactionEntity>,
  ) {}

  async getMyTransactions(userId: number) {
    const transactions = await this.transactionsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

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
}
