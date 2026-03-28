import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { UserEntity } from '../users/entities/user.entity';
import { TransactionEntity } from '../transactions/entities/transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, TransactionEntity])],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
