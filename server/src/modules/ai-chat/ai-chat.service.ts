import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { ChatHistoryEntity, ChatRole } from './entities/chat-history.entity';
import { UserEntity } from '../users/entities/user.entity';
import {
  InvestmentEntity,
  InvestmentStatus,
} from '../investments/entities/investment.entity';

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

interface GeminiApiErrorPayload {
  errorCode?: string;
  message?: string;
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
  private static readonly DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

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

    const userFinancialContext = await this.buildUserFinancialContext(userId);

    const reply = await this.generateGeminiReply(
      normalizedMessage,
      recentMessages,
      projectContext ?? null,
      userFinancialContext,
    );

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

  private async generateGeminiReply(
    userMessage: string,
    recentMessages: GeminiMessage[],
    projectContext: Record<string, unknown> | null,
    userFinancialContext: UserFinancialContext,
  ): Promise<string> {
    const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    const geminiModel =
      this.configService.get<string>('GEMINI_MODEL') ||
      AiChatService.DEFAULT_GEMINI_MODEL;

    if (!geminiApiKey) {
      console.error('[AiChatService] GEMINI_API_KEY is missing in server env.');
      return AiChatService.SOFT_FALLBACK_MESSAGE;
    }

    try {
      const projectsJsonText = await this.readProjectsJsonText();
      const systemInstruction = this.buildSystemInstruction(
        projectsJsonText,
        userFinancialContext,
      );
      const contents = this.buildGeminiContents(
        recentMessages,
        userMessage,
        projectContext,
      );

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents,
          generationConfig: {
            temperature: 0.3,
            topP: 0.9,
            maxOutputTokens: 700,
          },
        }),
      });

      if (!response.ok) {
        const raw = await response.text();
        const parsed = this.parseApiErrorPayload(raw);
        const quotaSignals = ['RESOURCE_EXHAUSTED', 'quota', '429', 'rate'];
        const lowerRaw = raw.toLowerCase();
        const isQuotaError =
          response.status === 429 ||
          parsed?.errorCode === 'GEMINI_QUOTA_EXCEEDED' ||
          quotaSignals.some((signal) =>
            lowerRaw.includes(signal.toLowerCase()),
          );

        if (isQuotaError) {
          return AiChatService.QUOTA_MESSAGE;
        }

        console.error(
          `[AiChatService] Gemini API error ${response.status}: ${raw}`,
        );
        return AiChatService.SOFT_FALLBACK_MESSAGE;
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };
      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((part) => part?.text)
          .filter(Boolean)
          .join('\n')
          .trim() || AiChatService.SOFT_FALLBACK_MESSAGE;

      return text;
    } catch (error) {
      console.error(
        '[AiChatService] Unable to call Gemini directly:',
        error instanceof Error ? error.message : error,
      );
      return AiChatService.SOFT_FALLBACK_MESSAGE;
    }
  }

  private async readProjectsJsonText(): Promise<string> {
    const configuredPath = this.configService.get<string>('PROJECTS_DATA_PATH');
    const candidatePaths = [
      configuredPath ? path.resolve(process.cwd(), configuredPath) : null,
      path.join(process.cwd(), 'src', 'data', 'projects-data.json'),
      path.join(process.cwd(), 'server', 'src', 'data', 'projects-data.json'),
    ].filter((p): p is string => Boolean(p));

    for (const filePath of candidatePaths) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const trimmed = content.trim();
        if (!trimmed) return '[]';
        JSON.parse(trimmed);
        return trimmed;
      } catch {
        // try next path
      }
    }

    return '[]';
  }

  private buildSystemInstruction(
    projectsJsonText: string,
    userFinancialContext: UserFinancialContext,
  ): string {
    const fullName = userFinancialContext.full_name || 'Nhà đầu tư';
    const balance = Number(userFinancialContext.balance || 0);
    const investmentsJson = JSON.stringify(
      userFinancialContext.investments ?? [],
      null,
      2,
    );

    return [
      `Bạn là Chuyên gia Cố vấn Đầu tư cao cấp của InvestPro. Hãy trả lời ${fullName} với giọng văn điềm tĩnh, khách quan và chuyên nghiệp.`,
      `Ngoài danh sách dự án chung, đây là dữ liệu tài chính của họ: Số dư: ${balance} VNĐ; Danh mục: ${investmentsJson}.`,
      'QUY TẮC CỐ VẤN TÀI CHÍNH:',
      '1. So sánh lãi suất: Luôn lấy mức lãi suất tiết kiệm ngân hàng 6%/năm làm mốc tham chiếu để so sánh với lãi suất dự án.',
      '2. Tính toán lợi nhuận: Khi tính toán, PHẢI trình bày rõ công thức: Lợi nhuận = Số tiền * (Lãi suất/100) * (Số tháng/12).',
      '3. Cảnh báo rủi ro: Dựa vào risk_level (low, medium, high) để đưa ra cảnh báo phù hợp. Risk level "high" cần khuyến cáo thận trọng và đa dạng hóa danh mục.',
      '4. Phân tích dự án cụ thể: Khi được yêu cầu phân tích dự án (qua projectContext), hãy trình bày theo cấu trúc sau:',
      '   - Đánh giá lợi nhuận: So sánh với thị trường và ngân hàng.',
      '   - Phân tích rủi ro: Các yếu tố cần lưu ý dựa trên mô tả và rủi ro.',
      '   - Kết luận: Đưa ra lời khuyên "Nên" hoặc "Không nên" đầu tư kèm lý do tóm tắt.',
      '',
      'DỮ LIỆU DỰ ÁN HỆ THỐNG (JSON):',
      projectsJsonText,
      '',
      'LƯU Ý BẢO MẬT & DỮ LIỆU:',
      '- Chỉ kết luận dựa trên dữ liệu thực tế được cung cấp.',
      '- Tuyệt đối không suy đoán thông tin nhạy cảm.',
      '- Nếu thông tin không có trong context, hãy trả lời là bạn không có dữ liệu chi tiết về phần đó.',
    ].join('\n\n');
  }

  private buildGeminiContents(
    recentMessages: GeminiMessage[],
    userMessage: string,
    projectContext: Record<string, unknown> | null,
  ) {
    const contents: Array<{
      role: 'user' | 'model';
      parts: Array<{ text: string }>;
    }> = [];

    for (const item of recentMessages) {
      if (!item.content) continue;
      contents.push({
        role: item.role === 'model' ? 'model' : 'user',
        parts: [{ text: String(item.content) }],
      });
    }

    const userPayload = [
      `Tin nhắn người dùng: ${userMessage}`,
      'projectContext (object dự án liên quan, có thể null):',
      JSON.stringify(projectContext ?? null, null, 2),
    ].join('\n\n');

    contents.push({
      role: 'user',
      parts: [{ text: userPayload }],
    });

    return contents;
  }

  private parseApiErrorPayload(raw: string): GeminiApiErrorPayload | null {
    try {
      return JSON.parse(raw) as GeminiApiErrorPayload;
    } catch {
      return null;
    }
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
        project_title:
          investment.project?.title ?? `Project #${investment.projectId}`,
        amount_invested: Number(investment.amount),
        interest_rate: Number(investment.project?.interestRate ?? 0),
        status: investment.status,
      })),
    };
  }
}
