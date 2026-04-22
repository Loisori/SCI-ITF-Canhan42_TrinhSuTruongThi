import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { ChatHistoryEntity } from './entities/chat-history.entity';
import { UserEntity } from '../users/entities/user.entity';
import { InvestmentEntity } from '../investments/entities/investment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatHistoryEntity, UserEntity, InvestmentEntity]),
  ],
  controllers: [AiChatController],
  providers: [AiChatService],
})
export class AiChatModule {}
