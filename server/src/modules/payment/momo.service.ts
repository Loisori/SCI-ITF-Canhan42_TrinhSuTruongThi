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

@Injectable()
export class MomoService {
  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async createMomoUrl(userId: number, amount: number) {
    const partnerCode = this.configService.get<string>('MOMO_PARTNER_CODE') || 'MOMO'; // Default to MoMo Sandbox
    const accessKey = this.configService.get<string>('MOMO_ACCESS_KEY') || '';
    const secretKey = this.configService.get<string>('MOMO_SECRET_KEY') || '';
    
    const endpoint = 'https://test-payment.momo.vn/v2/gateway/api/create';
    
    const clientBaseUrl = this.configService.get<string>('CLIENT_URL') || '';
    const apiUrl = this.configService.get<string>('API_URL') || '';

    // MoMo V2 API strictly requires redirectUrl (not returnUrl)
    const redirectUrl = this.configService.get<string>('MOMO_RETURN_URL') || `${clientBaseUrl}/dashboard?tab=wallet`;
    const ipnUrl = `${apiUrl}/api/payment/momo-ipn`;

    const orderInfo = 'Nạp tiền vào ví InvestPro';
    const amountStr = String(amount);
    const orderId = `${userId}_${Date.now()}`;
    const requestId = orderId;
    const requestType = 'captureWallet';
    const extraData = '';

    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amountStr}` +
      `&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}` +
      `&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}` +
      `&requestType=${requestType}`;

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      amount: amountStr,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: 'vi',
    };

    console.log('[MoMo] POST /create requestBody:', requestBody);

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await resp.json();
      console.log('[MoMo] POST /create response:', data);

      if (data.resultCode !== 0) {
        throw new InternalServerErrorException(data.message || 'Lỗi từ gateway MoMo.');
      }

      await this.createPendingDepositTransaction(userId, amount, orderId);

      return {
        momoUrl: data.payUrl,
        orderId,
      };
    } catch (err: any) {
      console.error('[MoMo] create URL error:', err);
      throw new InternalServerErrorException(err.message || 'Không thể tạo link thanh toán MoMo.');
    }
  }

  async handleMomoIpn(body: Record<string, any>) {
    const accessKey = this.configService.get<string>('MOMO_ACCESS_KEY') || 'M8brj9K6E22vXoDB';
    const secretKey = this.configService.get<string>('MOMO_SECRET_KEY') || 'nqQiVSgDMy809JoPF6OzP5OdPXBUpR25';

    console.log('[MoMo] IPN received:', body);

    const {
      amount,
      extraData = "",
      message,
      orderId,
      orderInfo,
      orderType,
      partnerCode: bodyPartnerCode,
      payType,
      requestId,
      responseTime,
      resultCode,
      signature,
      transId,
    } = body;

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${bodyPartnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const calculatedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    if (calculatedSignature !== signature) {
      console.error('[MoMo] IPN signature mismatched.');
      return { resultCode: 99, message: 'Invalid signature' };
    }

    if (resultCode === 0) {
      const userId = Number(orderId.split('_')[0]);
      if (userId && !isNaN(userId)) {
         await this.confirmDepositSuccess(userId, orderId, Number(amount));
         return { resultCode: 0, message: 'Success.' };
      }
    } else {
        await this.markTransactionFailed(orderId);
    }
    
    return { resultCode: 0, message: 'Processed.' };
  }

  private async createPendingDepositTransaction(userId: number, amount: number, txnRef: string) {
    const transactionsRepo = this.dataSource.getRepository(TransactionEntity);
    const existed = await transactionsRepo.findOne({
      where: { userId, type: TransactionType.DEPOSIT, description: `MoMo deposit ${txnRef}` },
    });
    if (existed) return;

    const transaction = transactionsRepo.create({
      userId,
      amount,
      type: TransactionType.DEPOSIT,
      status: TransactionStatus.PENDING,
      description: `MoMo deposit ${txnRef}`,
      referenceId: null,
    });
    await transactionsRepo.save(transaction);
  }

  private async confirmDepositSuccess(userId: number, txnRef: string, amount: number) {
    await this.dataSource.transaction(async (manager) => {
      const usersRepo = manager.getRepository(UserEntity);
      const transactionsRepo = manager.getRepository(TransactionEntity);

      const user = await usersRepo.findOne({
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new BadRequestException('User not found.');

      const transaction = await transactionsRepo.findOne({
        where: { userId, type: TransactionType.DEPOSIT, description: `MoMo deposit ${txnRef}` },
        lock: { mode: 'pessimistic_write' },
      });
      
      if (!transaction) throw new BadRequestException('Transaction not found.');
      if (transaction.status === TransactionStatus.SUCCESS) return;
      if (Number(transaction.amount) !== Number(amount)) throw new BadRequestException('Amount mismatch.');

      user.balance = Number(user.balance) + amount;
      transaction.status = TransactionStatus.SUCCESS;

      await usersRepo.save(user);
      await transactionsRepo.save(transaction);
    });
  }

  private async markTransactionFailed(txnRef: string) {
    const transactionsRepo = this.dataSource.getRepository(TransactionEntity);
    const tx = await transactionsRepo.findOne({
      where: { type: TransactionType.DEPOSIT, description: `MoMo deposit ${txnRef}` },
    });
    if (!tx || tx.status === TransactionStatus.SUCCESS) return;
    
    tx.status = TransactionStatus.FAILED;
    await transactionsRepo.save(tx);
  }
}
