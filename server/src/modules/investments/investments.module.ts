import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvestmentsController } from './investments.controller';
import { InvestmentsService } from './investments.service';
import { InvestmentEntity } from './entities/investment.entity';
import { PaymentScheduleEntity } from './entities/schedule.entity';
import { UserEntity } from '../users/entities/user.entity';
import { ProjectEntity } from '../projects/entities/project.entity';
import { TransactionEntity } from '../transactions/entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InvestmentEntity,
      PaymentScheduleEntity,
      UserEntity,
      ProjectEntity,
      TransactionEntity,
    ]),
  ],
  controllers: [InvestmentsController],
  providers: [InvestmentsService],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}
