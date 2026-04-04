import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PORT = Number(process.env.PORT || 3010);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function resolveProjectsPath() {
  const configured =
    process.env.PROJECTS_DATA_PATH ||
    "../../server/src/data/projects-data.json";
  return path.resolve(__dirname, configured);
}

async function readProjectsJsonText() {
  const filePath = resolveProjectsPath();
  try {
    const content = await fs.readFile(filePath, "utf8");
    const trimmed = content.trim();
    if (!trimmed) {
      return "[]";
    }

    JSON.parse(trimmed);
    return trimmed;
  } catch (error) {
    console.warn(
      "[AI Service] Cannot read/parse projects-data.json, fallback []:",
      error?.message || error,
    );
    return "[]";
  }
}

function buildSystemInstruction(projectsJsonText, userFinancialContext) {
  const fullName = userFinancialContext?.full_name || "Nhà đầu tư";
  const balance = Number(userFinancialContext?.balance || 0);
  const investments = Array.isArray(userFinancialContext?.investments)
    ? userFinancialContext.investments
    : [];
  const investmentsJson = JSON.stringify(investments, null, 2);

  return [
    `Bạn là Trợ lý tài chính cá nhân của ${fullName}. Ngoài danh sách dự án chung của InvestPro, đây là dữ liệu tài chính riêng của họ: Số dư khả dụng: ${balance} VNĐ; Danh mục đang đầu tư: ${investmentsJson}.`,
    "Hãy trả lời các câu hỏi như: Ví của tôi còn bao nhiêu? Tôi đã đầu tư bao nhiêu tiền? Với số dư hiện tại, tôi nên đầu tư thêm vào dự án nào để tối ưu lợi nhuận?",
    "Bạn là chuyên gia phân tích của InvestPro. Dưới đây là danh sách dự án hiện tại của chúng tôi dưới dạng JSON:",
    projectsJsonText,
    "Hãy dựa vào dữ liệu này để trả lời người dùng. Nếu thông tin không có trong JSON, hãy nói bạn không biết.",
    "Quy tắc bổ sung:",
    "- Chỉ kết luận dựa trên dữ liệu JSON và context được cung cấp.",
    "- Khi so sánh lãi suất, rủi ro hoặc vốn, hãy nêu rõ tên dự án liên quan.",
    "- Nếu người dùng hỏi về một dự án cụ thể, ưu tiên dùng object projectContext nếu có.",
    "- Chỉ sử dụng dữ liệu user_financial_context của đúng người dùng hiện tại được gửi kèm request.",
    "- Tuyệt đối không suy đoán hoặc tiết lộ thông tin nhạy cảm (mật khẩu, secret key, token).",
  ].join("\n\n");
}

function buildContents({ recentMessages, userMessage, projectContext }) {
  const contents = [];

  for (const item of recentMessages || []) {
    if (!item?.content) continue;
    const normalizedRole = item.role === "model" ? "model" : "user";
    contents.push({
      role: normalizedRole,
      parts: [{ text: String(item.content) }],
    });
  }

  const userPayload = [
    `Tin nhắn người dùng: ${userMessage}`,
    "projectContext (object dự án liên quan, có thể null):",
    JSON.stringify(projectContext ?? null, null, 2),
  ].join("\n\n");

  contents.push({
    role: "user",
    parts: [{ text: userPayload }],
  });

  return contents;
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "investpro-ai-service" });
});

app.post("/chat", async (req, res) => {
  const userMessage = String(req.body?.message || "").trim();
  const recentMessages = Array.isArray(req.body?.recentMessages)
    ? req.body.recentMessages
    : [];
  const projectContext = req.body?.projectContext ?? null;
  const userFinancialContext = req.body?.user_financial_context ?? null;

  if (!userMessage) {
    return res.status(400).json({ message: "message is required" });
  }

  if (!GEMINI_API_KEY) {
    return res
      .status(500)
      .json({ message: "GEMINI_API_KEY is missing in ai-service env." });
  }

  try {
    const projectsJsonText = await readProjectsJsonText();
    const systemInstruction = buildSystemInstruction(
      projectsJsonText,
      userFinancialContext,
    );
    const contents = buildContents({
      recentMessages,
      userMessage,
      projectContext,
    });

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    console.log(`[AI Service] Gemini API response status: ${response.status}`);
    if (!response.ok) {
      const raw = await response.text();
      const quotaSignals = ["RESOURCE_EXHAUSTED", "quota", "429", "rate"];
      const lowerRaw = raw.toLowerCase();
      const isQuotaError =
        response.status === 429 ||
        quotaSignals.some((signal) => lowerRaw.includes(signal.toLowerCase()));

      if (isQuotaError) {
        return res.status(429).json({
          errorCode: "GEMINI_QUOTA_EXCEEDED",
          message: "Gemini quota exceeded. Please retry later.",
          status: response.status,
        });
      }

      return res.status(502).json({
        message: "Gemini API error",
        errorCode: "GEMINI_API_ERROR",
        status: response.status,
        detail: raw,
      });
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part?.text)
        .filter(Boolean)
        .join("\n")
        .trim() || "Xin lỗi, tôi chưa thể trả lời lúc này.";

    return res.json({
      reply: text,
      model: GEMINI_MODEL,
      usedRecentMessages: recentMessages.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: "AI service failed",
      errorCode: "AI_SERVICE_INTERNAL_ERROR",
      detail: error instanceof Error ? error.message : "unknown_error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`[AI Service] listening on http://localhost:${PORT}`);
  console.log(`[AI Service] projects path: ${resolveProjectsPath()}`);
});
