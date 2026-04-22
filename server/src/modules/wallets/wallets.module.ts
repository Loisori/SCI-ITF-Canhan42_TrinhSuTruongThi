import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { TransactionEntity } from '../transactions/entities/transaction.entity';
import { UserEntity } from '../users/entities/user.entity';
import { InvestmentEntity } from '../investments/entities/investment.entity';
import { PaymentScheduleEntity } from '../investments/entities/schedule.entity';
import { ProjectEntity } from '../projects/entities/project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransactionEntity,
      UserEntity,
      InvestmentEntity,
      PaymentScheduleEntity,
      ProjectEntity,
    ]),
  ],
  providers: [WalletsService],
  controllers: [WalletsController],
  exports: [WalletsService],
})
export class WalletsModule {}
