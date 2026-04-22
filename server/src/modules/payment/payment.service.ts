import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { DataSource } from 'typeorm';
import {
  TransactionEntity,
  TransactionStatus,
  TransactionType,
} from '../transactions/entities/transaction.entity';
import { UserEntity } from '../users/entities/user.entity';

type VnpParams = Record<string, string>;

@Injectable()
export class PaymentService {
  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async createVnpayUrl(userId: number, amount: number, ipAddress: string) {
    const vnpUrl = this.configService.get<string>('VNP_URL')?.trim();
    const tmnCode = this.configService.get<string>('VNP_TMN_CODE')?.trim();
    const hashSecret = this.configService
      .get<string>('VNP_HASH_SECRET')
      ?.trim();
    const returnUrl = this.configService.get<string>('VNP_RETURN_URL')?.trim();

    if (!vnpUrl || !tmnCode || !hashSecret || !returnUrl) {
      throw new InternalServerErrorException('VNPay configuration is missing.');
    }

    const normalizedAmount = Math.round(Number(amount));
    if (!Number.isFinite(normalizedAmount) || normalizedAmount < 1000) {
      throw new BadRequestException('Số tiền nạp không hợp lệ.');
    }

    const txnRef = `${userId}_${Date.now()}`;
    const createDate = this.formatDate(new Date());

    const params: VnpParams = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Amount: String(normalizedAmount * 100),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: 'Nap-tien-InvestPro',
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: this.normalizeIp(ipAddress),
      vnp_CreateDate: createDate,
    };

    if (
      !params.vnp_TmnCode ||
      !params.vnp_ReturnUrl ||
      !params.vnp_TxnRef ||
      params.vnp_Version !== '2.1.0'
    ) {
      throw new InternalServerErrorException(
        'Missing required VNPay parameters.',
      );
    }

    const sortedParams = this.pickAndSortVnpParams(params);
    const rawString = this.buildHashData(sortedParams);
    console.log('[VNPay] create-url rawString (new):', rawString);
    const secureHash = crypto
      .createHmac('sha512', hashSecret)
      .update(rawString, 'utf8')
      .digest('hex');

    const encodedQuery = this.buildQuery(sortedParams, true);
    const paymentUrl = `${vnpUrl}?${encodedQuery}&vnp_SecureHash=${encodeURIComponent(secureHash)}`;

    console.log('[VNPay] create-url finalUrl:', paymentUrl);

    await this.createPendingDepositTransaction(
      userId,
      normalizedAmount,
      txnRef,
    );

    return {
      vnpayUrl: paymentUrl,
      txnRef,
    };
  }

  async handleVnpayReturn(
    query: Record<string, string | string[] | undefined>,
  ) {
    const { params } = this.verifyVnpSignature(query);
    const responseCode = params.vnp_ResponseCode;
    const txnRef = params.vnp_TxnRef;
    const amount = Number(params.vnp_Amount ?? '0') / 100;

    if (responseCode !== '00') {
      if (txnRef) {
        await this.markTransactionFailed(txnRef);
      }
      return {
        success: false,
        code: responseCode ?? 'unknown',
        message: 'Thanh toán không thành công.',
        txnRef,
      };
    }

    const userId = Number((txnRef ?? '').split('_')[0]);
    if (!userId || Number.isNaN(userId)) {
      throw new BadRequestException('Invalid txnRef.');
    }

    await this.confirmDepositSuccess(userId, txnRef, amount);

    return {
      success: true,
      code: responseCode,
      message: 'Nạp tiền thành công.',
      txnRef,
      amount,
    };
  }

  async handleVnpayIpn(query: Record<string, string | string[] | undefined>) {
    try {
      const { params } = this.verifyVnpSignature(query);
      const responseCode = params.vnp_ResponseCode;
      const txnRef = params.vnp_TxnRef;
      const amount = Number(params.vnp_Amount ?? '0') / 100;

      if (!txnRef) {
        return { RspCode: '01', Message: 'Order not found' };
      }

      const userId = Number((txnRef ?? '').split('_')[0]);
      if (!userId || Number.isNaN(userId)) {
        return { RspCode: '01', Message: 'Order not found' };
      }

      const txn = await this.dataSource
        .getRepository(TransactionEntity)
        .findOne({
          where: {
            userId,
            type: TransactionType.DEPOSIT,
            description: `VNPay deposit ${txnRef}`,
          },
        });

      if (!txn) {
        return { RspCode: '01', Message: 'Order not found' };
      }

      if (Number(txn.amount) !== Number(amount)) {
        return { RspCode: '04', Message: 'Invalid amount' };
      }

      if (txn.status === TransactionStatus.SUCCESS) {
        return { RspCode: '02', Message: 'Order already confirmed' };
      }

      if (responseCode === '00') {
        await this.confirmDepositSuccess(userId, txnRef, amount);
        return { RspCode: '00', Message: 'Confirm Success' };
      }

      await this.markTransactionFailed(txnRef);
      return { RspCode: '00', Message: 'Confirm Success' };
    } catch {
      return { RspCode: '97', Message: 'Invalid Checksum' };
    }
  }

  private pickAndSortVnpParams(input: VnpParams): VnpParams {
    const result: VnpParams = {};
    const sortedKeys = Object.keys(input)
      .filter((key) => key.startsWith('vnp_'))
      .sort();

    sortedKeys.forEach((key) => {
      result[key] = input[key];
    });

    return result;
  }

  private verifyVnpSignature(
    query: Record<string, string | string[] | undefined>,
  ): { params: VnpParams } {
    const hashSecret = this.configService
      .get<string>('VNP_HASH_SECRET')
      ?.trim();
    if (!hashSecret) {
      throw new InternalServerErrorException('VNPay configuration is missing.');
    }

    const rawSecureHash = query.vnp_SecureHash;
    const secureHash = Array.isArray(rawSecureHash)
      ? rawSecureHash[0]
      : rawSecureHash;
    if (!secureHash) {
      throw new BadRequestException('Missing vnp_SecureHash.');
    }

    const params: VnpParams = {};
    Object.keys(query).forEach((key) => {
      if (
        !key.startsWith('vnp_') ||
        key === 'vnp_SecureHash' ||
        key === 'vnp_SecureHashType'
      ) {
        return;
      }

      const value = query[key];
      if (typeof value === 'string') {
        params[key] = value;
      } else if (Array.isArray(value) && value.length > 0) {
        params[key] = value[0] ?? '';
      }
    });

    const sortedParams = this.pickAndSortVnpParams(params);
    const rawString = this.buildHashData(sortedParams);
    console.log('[VNPay] verify rawString:', rawString);
    const calculatedHash = crypto
      .createHmac('sha512', hashSecret)
      .update(rawString, 'utf8')
      .digest('hex');

    if (calculatedHash !== secureHash) {
      throw new BadRequestException('Invalid VNPay signature.');
    }

    return { params };
  }

  private buildQuery(input: VnpParams, encodeValue: boolean): string {
    return Object.keys(input)
      .map((key) => {
        const value = input[key] ?? '';
        if (!encodeValue) {
          return `${key}=${value}`;
        }

        const encodedKey = encodeURIComponent(key);
        const encodedVal = encodeURIComponent(value).replace(/%20/g, '+');
        return `${encodedKey}=${encodedVal}`;
      })
      .join('&');
  }

  private buildHashData(input: VnpParams): string {
    return Object.keys(input)
      .map((key) => {
        const value = input[key] ?? '';
        if (key === 'vnp_ReturnUrl') {
          return `${key}=${encodeURIComponent(value)}`;
        }
        return `${key}=${value}`;
      })
      .join('&');
  }

  private async createPendingDepositTransaction(
    userId: number,
    amount: number,
    txnRef: string,
  ) {
    const transactionsRepo = this.dataSource.getRepository(TransactionEntity);

    const existed = await transactionsRepo.findOne({
      where: {
        userId,
        type: TransactionType.DEPOSIT,
        description: `VNPay deposit ${txnRef}`,
      },
    });

    if (existed) {
      return;
    }

    const transaction = transactionsRepo.create({
      userId,
      amount,
      type: TransactionType.DEPOSIT,
      status: TransactionStatus.PENDING,
      description: `VNPay deposit ${txnRef}`,
      referenceId: null,
    });
    await transactionsRepo.save(transaction);
  }

  private async confirmDepositSuccess(
    userId: number,
    txnRef: string,
    amount: number,
  ) {
    await this.dataSource.transaction(async (manager) => {
      const usersRepo = manager.getRepository(UserEntity);
      const transactionsRepo = manager.getRepository(TransactionEntity);

      const user = await usersRepo.findOne({
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) {
        throw new BadRequestException('User not found.');
      }

      const transaction = await transactionsRepo.findOne({
        where: {
          userId,
          type: TransactionType.DEPOSIT,
          description: `VNPay deposit ${txnRef}`,
        },
        lock: { mode: 'pessimistic_write' },
      });
      if (!transaction) {
        throw new BadRequestException('Transaction not found.');
      }
      if (transaction.status === TransactionStatus.SUCCESS) {
        return;
      }
      if (Number(transaction.amount) !== Number(amount)) {
        throw new BadRequestException('Amount mismatch.');
      }

      user.balance = Number(user.balance) + amount;
      transaction.status = TransactionStatus.SUCCESS;

      await usersRepo.save(user);
      await transactionsRepo.save(transaction);
    });
  }

  private async markTransactionFailed(txnRef: string) {
    const transactionsRepo = this.dataSource.getRepository(TransactionEntity);
    const tx = await transactionsRepo.findOne({
      where: {
        type: TransactionType.DEPOSIT,
        description: `VNPay deposit ${txnRef}`,
      },
    });
    if (!tx || tx.status === TransactionStatus.SUCCESS) {
      return;
    }
    tx.status = TransactionStatus.FAILED;
    await transactionsRepo.save(tx);
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${y}${m}${d}${hh}${mm}${ss}`;
  }

  private normalizeIp(ipAddress?: string): string {
    if (!ipAddress) {
      return '127.0.0.1';
    }

    const cleaned = ipAddress.replace('::ffff:', '').trim();
    return cleaned || '127.0.0.1';
  }
}
