import {
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ChatHistoryEntity, ChatRole } from './entities/chat-history.entity';
import { UserEntity } from '../users/entities/user.entity';
import { InvestmentEntity, InvestmentStatus } from '../investments/entities/investment.entity';

interface GeminiMessage {
  role: 'user' | 'model';
  content: string;
}

interface UserFinancialContext {
  user_id: number;
  full_name: string;
  balance: number;
  investments: Array<{
    project_id: number;
    project_title: string;
    amount_invested: number;
    interest_rate: number;
    status: InvestmentStatus;
  }>;
}

@Injectable()
export class AiChatService {
  constructor(
    @InjectRepository(ChatHistoryEntity)
    private readonly chatHistoryRepository: Repository<ChatHistoryEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(InvestmentEntity)
    private readonly investmentsRepository: Repository<InvestmentEntity>,
    private readonly configService: ConfigService,
  ) {}

  private static readonly SOFT_FALLBACK_MESSAGE =
    'Chuyên gia đang bận, vui lòng thử lại sau';
  private static readonly QUOTA_MESSAGE =
    'Hệ thống AI đang quá tải, vui lòng thử lại sau 1 phút.';

  async getHistory(userId: number) {
    const rows = await this.chatHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    const items = rows
      .slice()
      .reverse()
      .map((row) => ({
        id: row.id,
        role: row.role,
        content: row.message,
        projectContext: row.projectContext,
        createdAt: row.createdAt,
      }));

    return { items };
  }

  async clearHistory(userId: number) {
    await this.chatHistoryRepository.delete({ userId });
    return { success: true };
  }

  async chat(
    userId: number,
    message: string,
    projectContext?: Record<string, unknown>,
  ) {
    const normalizedMessage = message.trim();
    const recentRows = await this.chatHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const recentMessages: GeminiMessage[] = recentRows
      .slice()
      .reverse()
      .map((row) => ({
        role: row.role === ChatRole.USER ? 'user' : 'model',
        content: row.message,
      }));

    const aiServiceUrl =
      this.configService.get<string>('AI_SERVICE_URL') ||
      'http://localhost:3010';

    const userFinancialContext =
      await this.buildUserFinancialContext(userId);

    let reply = AiChatService.SOFT_FALLBACK_MESSAGE;

    try {
      const response = await fetch(`${aiServiceUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: normalizedMessage,
          recentMessages,
          projectContext: projectContext ?? null,
          user_financial_context: userFinancialContext,
        }),
      });

      if (!response.ok) {
        const raw = await response.text();
        let parsed: { errorCode?: string; message?: string } | null = null;

        try {
          parsed = JSON.parse(raw) as { errorCode?: string; message?: string };
        } catch {
          parsed = null;
        }

        const isQuotaError =
          response.status === 429 ||
          parsed?.errorCode === 'GEMINI_QUOTA_EXCEEDED';

        if (isQuotaError) {
          reply = AiChatService.QUOTA_MESSAGE;
        } else {
          console.error(
            `[AiChatService] AI service failed with status ${response.status}: ${raw}`,
          );
        }
      } else {
        const data = (await response.json()) as { reply?: string };
        reply = (data.reply || '').trim() || reply;
      }
    } catch (error) {
      console.error(
        '[AiChatService] Unable to call AI service:',
        error instanceof Error ? error.message : error,
      );
    }

    await this.chatHistoryRepository.save([
      this.chatHistoryRepository.create({
        userId,
        role: ChatRole.USER,
        message: normalizedMessage,
        projectContext: projectContext ?? null,
      }),
      this.chatHistoryRepository.create({
        userId,
        role: ChatRole.MODEL,
        message: reply,
        projectContext: projectContext ?? null,
      }),
    ]);

    return {
      reply,
      contextSize: recentMessages.length,
    };
  }

  private async buildUserFinancialContext(
    userId: number,
  ): Promise<UserFinancialContext> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'fullName', 'balance'],
    });

    const investments = await this.investmentsRepository.find({
      where: { userId },
      relations: ['project'],
      order: { investedAt: 'DESC' },
      take: 100,
    });

    return {
      user_id: userId,
      full_name: user?.fullName ?? 'Nhà đầu tư',
      balance: Number(user?.balance ?? 0),
      investments: investments.map((investment) => ({
        project_id: investment.projectId,
        project_title: investment.project?.title ?? `Project #${investment.projectId}`,
        amount_invested: Number(investment.amount),
        interest_rate: Number(investment.project?.interestRate ?? 0),
        status: investment.status,
      })),
    };
  }
}
