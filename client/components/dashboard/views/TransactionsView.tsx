"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { formatVnd } from "@/lib/utils";
import { Transaction } from "@/types/transaction";
import { ReceiptText } from "lucide-react";

export default function TransactionsView() {
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ["transactions-history", filterType, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType) params.append("type", filterType);
      if (filterStatus) params.append("status", filterStatus);
      return (await api.get<Transaction[]>(`/api/transactions?${params.toString()}`)).data;
    },
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-h3 font-bold text-slate-900 dark:text-white">Nhật ký giao dịch</h1>
          <p className="text-slate-600 dark:text-slate-400 text-body mt-1">Xem lại toàn bộ lịch sử nạp, rút và đầu tư của bạn.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-smaller font-semibold outline-none focus:border-primary transition-colors"
            >
              <option value="">Tất cả loại giao dịch</option>
              <option value="deposit">Nạp tiền</option>
              <option value="withdrawal">Rút tiền</option>
              <option value="invest">Đầu tư</option>
              <option value="interest_receive">Nhận Lợi nhuận</option>
              <option value="disbursement">Nhận Giải ngân</option>
              <option value="repay_interest">Trả Lãi</option>
              <option value="repay_principal">Trả Gốc</option>
              <option value="refund">Hoàn tiền</option>
              <option value="system_fee">Phí hệ thống</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-smaller font-semibold outline-none focus:border-primary transition-colors"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="success">Thành công</option>
              <option value="pending">Đang chờ</option>
              <option value="failed">Thất bại</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading && (
            <div className="p-8 space-y-3 animate-pulse">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800/50"
                />
              ))}
            </div>
          )}

          {error && (
            <div className="p-8 text-center text-red-500">
              Không thể tải lịch sử giao dịch.
            </div>
          )}

          {!isLoading && !error && (
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/20 text-[11px] uppercase text-slate-400 font-bold tracking-widest border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Giao dịch / Mô tả</th>
                  <th className="px-6 py-4">Số tiền</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((t) => {
                  const isPositive = ['deposit', 'interest_receive', 'refund', 'disbursement', 'system_fee'].includes(t.type);

                  let displayType = t.type;
                  if (t.type === 'deposit') displayType = "Nạp tiền";
                  else if (t.type === 'withdrawal') displayType = "Rút tiền";
                  else if (t.type === 'invest') displayType = "Đầu tư";
                  else if (t.type === 'interest_receive') displayType = "Nhận Lợi nhuận";
                  else if (t.type === 'refund') displayType = "Hoàn tiền";
                  else if (t.type === 'disbursement') displayType = "Nhận Giải Ngân";
                  else if (t.type === 'repay_interest') displayType = "Trả Lãi";
                  else if (t.type === 'repay_principal') displayType = "Trả Gốc";
                  else if (t.type === 'system_fee') displayType = "Phí Hệ Thống";

                  return (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-smaller font-bold text-slate-900 dark:text-white capitalize">{displayType}</p>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-[250px] truncate" title={t.description || undefined}>{t.description || "-"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className={`text-smaller font-extrabold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isPositive ? "+" : "-"}{formatVnd(Number(t.amount))}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${t.status === 'success' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                          t.status === 'pending' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                            'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-smallest font-medium text-slate-700 dark:text-slate-300">
                        {new Date(t.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(t.createdAt).toLocaleTimeString('vi-VN')}
                      </p>
                    </td>
                  </tr>
                  );
                })}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <ReceiptText className="text-[48px] text-slate-200 dark:text-slate-800 mb-3 mx-auto" />
                      <p className="text-slate-500 text-small font-semibold">Chưa có giao dịch nào phù hợp.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
