import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { AiChatService } from './ai-chat.service';
import { CreateAiChatDto } from './dto/create-ai-chat.dto';

@Controller('ai-chat')
@UseGuards(JwtAuthGuard)
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Get('history')
  history(@GetUser('id') userId: number) {
    return this.aiChatService.getHistory(userId);
  }

  @Delete('history')
  clearHistory(@GetUser('id') userId: number) {
    return this.aiChatService.clearHistory(userId);
  }

  @Post('message')
  chat(@GetUser('id') userId: number, @Body() dto: CreateAiChatDto) {
    return this.aiChatService.chat(userId, dto.message, dto.projectContext);
  }
}
