import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { MomoService } from './momo.service';
import { UserEntity } from '../users/entities/user.entity';
import { TransactionEntity } from '../transactions/entities/transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, TransactionEntity])],
  controllers: [PaymentController],
  providers: [PaymentService, MomoService],
  exports: [PaymentService, MomoService],
})
export class PaymentModule {}
