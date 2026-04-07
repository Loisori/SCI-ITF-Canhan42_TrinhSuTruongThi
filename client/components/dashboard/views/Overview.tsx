"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { formatVnd } from "@/lib/utils";
import { UserProfile } from "@/types/user";
import { Investment } from "@/types/investment";
import { Transaction } from "@/types/transaction";

export default function Overview({ profile }: { profile: UserProfile }) {
  const { data: investments = [] } = useQuery({
    queryKey: ["investments-my"],
    queryFn: async () => (await api.get<Investment[]>("/api/investments/my-investments")).data,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions-my"],
    queryFn: async () => (await api.get<Transaction[]>("/api/transactions")).data,
  });

  const activeInvestments = investments.filter((i) => i.status === "active");
  const totalActiveInvested = activeInvestments.reduce((sum, i) => sum + Number(i.amount), 0);
  const profitReceived = transactions
    .filter((t) => t.status === "success" && t.type === "interest_receive")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const roiPercent = totalActiveInvested > 0 ? Number(((profitReceived / totalActiveInvested) * 100).toFixed(2)) : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-h3 font-bold text-slate-900 dark:text-white">Tổng quan</h1>
        <p className="text-slate-600 dark:text-slate-400 text-body mt-1">
          Xin chào {profile.fullName}, chào mừng trở lại dashboard của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <p className="text-smaller font-bold text-slate-500 uppercase tracking-wider mb-2">Số dư hiện tại</p>
          <p className="text-h4 font-bold text-green-600 dark:text-green-400">{formatVnd(Number(profile.balance))}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <p className="text-smaller font-bold text-slate-500 uppercase tracking-wider mb-2">Đang đầu tư</p>
          <p className="text-h4 font-bold text-slate-900 dark:text-white">{formatVnd(totalActiveInvested)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <p className="text-smaller font-bold text-slate-500 uppercase tracking-wider mb-2">Lợi nhuận (ROI)</p>
          <p className="text-h4 font-bold text-emerald-600 dark:text-emerald-400">{roiPercent}%</p>
          <p className="text-[11px] text-slate-500 mt-2">Tổng nhận: {formatVnd(profitReceived)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
        <span className="material-symbols-outlined text-h1 text-slate-200 dark:text-slate-800 mb-4">insights</span>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Phân tích chuyên sâu</h3>
        <p className="text-smaller text-slate-500 mt-2 max-w-md mx-auto">
          Tính năng biểu đồ tăng trưởng và phân tích dòng tiền đang được phát triển và sẽ sớm ra mắt.
        </p>
      </div>
    </div>
  );
}
