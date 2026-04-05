"use client";

//servies
import { FormEvent, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/lib/axios";

//types
import {
  ChatHistoryItem,
  ChatMessage,
  ChatRole,
  ProjectContextEvent,
  ProjectContextPayload,
} from "@/types/chat";

const PROJECT_CONTEXT_EVENT = "investpro-project-context";
const SOFT_FALLBACK_MESSAGE = "Chuyên gia đang bận, vui lòng thử lại sau";
const DEFAULT_WELCOME: ChatMessage = {
  id: "welcome",
  role: "model",
  content:
    "Xin chào, tôi là trợ lý phân tích InvestPro. Bạn có thể hỏi về lãi suất, rủi ro hoặc chi tiết dự án.",
};

export default function AIChatbox() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [canChat, setCanChat] = useState(false);
  const [projectContext, setProjectContext] =
    useState<ProjectContextPayload>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([DEFAULT_WELCOME]);

  useEffect(() => {
    const onProjectContext = (event: Event) => {
      const custom = event as ProjectContextEvent;
      setProjectContext(custom.detail ?? null);
    };

    window.addEventListener(PROJECT_CONTEXT_EVENT, onProjectContext);

    return () => {
      window.removeEventListener(PROJECT_CONTEXT_EVENT, onProjectContext);
    };
  }, []);

  useEffect(() => {
    if (!pathname.startsWith("/projects/")) {
      setProjectContext(null);
    }
  }, [pathname]);

  useEffect(() => {
    const syncAuth = () => {
      setCanChat(Boolean(Cookies.get("access_token")));
    };

    syncAuth();
    window.addEventListener("auth-changed", syncAuth);

    return () => {
      window.removeEventListener("auth-changed", syncAuth);
    };
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      if (!canChat) {
        setMessages([DEFAULT_WELCOME]);
        return;
      }

      try {
        const res = await api.get<{ items: ChatHistoryItem[] }>(
          "/api/ai-chat/history",
        );

        // Sửa đoạn map này để ép kiểu rõ ràng cho TypeScript
        const history: ChatMessage[] = (res.data.items ?? []).map((item) => ({
          id: `history-${item.id}`,
          // Sử dụng 'as ChatRole' để khẳng định với TS đây là kiểu dữ liệu chuẩn
          role: (item.role === "user" ? "user" : "model") as ChatRole,
          content: item.content,
        }));

        setMessages(history.length > 0 ? history : [DEFAULT_WELCOME]);
      } catch (error) {
        console.error("Failed to load chat history:", error);
        setMessages([DEFAULT_WELCOME]);
      }
    };

    void loadHistory();
  }, [canChat]);

  const addMessage = (role: ChatRole, content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role,
        content,
      },
    ]);
  };

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();

    const message = input.trim();
    if (!message || sending) {
      return;
    }

    if (!canChat) {
      addMessage(
        "model",
        "Bạn cần đăng nhập để dùng chatbox AI. Vui lòng đăng nhập rồi thử lại.",
      );
      return;
    }

    addMessage("user", message);
    setInput("");
    setSending(true);

    try {
      const response = await api.post<{ reply: string }>(
        "/api/ai-chat/message",
        {
          message,
          projectContext,
        },
      );
      console.log("AI response:", response.data);

      addMessage("model", response.data.reply || SOFT_FALLBACK_MESSAGE);
    } catch (error: unknown) {
      const messageFromApi = (
        error as {
          response?: { data?: { message?: string | string[] } };
        }
      )?.response?.data?.message;

      const normalized = Array.isArray(messageFromApi)
        ? (messageFromApi[0] ?? SOFT_FALLBACK_MESSAGE)
        : (messageFromApi ?? SOFT_FALLBACK_MESSAGE);

      addMessage("model", normalized);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[80]">
      {isOpen ? (
        <div className="w-[350px] max-w-[92vw] h-[500px] max-h-[72vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/70">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                InvestPro AI Chatbox
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Phân tích dữ liệu dự án theo thời gian thực
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md px-2 py-1 text-xs font-semibold border border-slate-300 dark:border-slate-600"
            >
              Đóng
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
            {messages.map((item) => (
              <div
                key={item.id}
                className={`max-w-[88%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap border ${
                  item.role === "user"
                    ? "ml-auto bg-primary text-white border-primary"
                    : "mr-auto bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-100 dark:border-emerald-800"
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1">
                  {item.role === "user" ? "Bạn" : "AI"}
                </p>
                {item.content}
              </div>
            ))}
            {sending && (
              <div className="max-w-[88%] rounded-xl px-3 py-2 text-sm bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-100 dark:border-emerald-800">
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1">
                  AI
                </p>
                <div className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-300 animate-bounce" />
                  <span
                    className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-300 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-300 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSend}
            className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Hỏi về dự án, lãi suất, rủi ro..."
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm"
              />
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-60"
              >
                Gửi
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="h-14 px-5 rounded-full bg-primary text-white shadow-xl font-bold text-sm"
        >
          AI Chatbox
        </button>
      )}
    </div>
  );
}
