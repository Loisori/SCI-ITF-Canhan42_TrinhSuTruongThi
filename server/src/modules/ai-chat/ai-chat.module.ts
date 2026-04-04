import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { ChatHistoryEntity } from './entities/chat-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatHistoryEntity])],
  controllers: [AiChatController],
  providers: [AiChatService],
})
export class AiChatModule {}
