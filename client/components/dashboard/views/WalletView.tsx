"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { formatVnd } from "@/lib/utils";
import { UserProfile } from "@/types/user";
import { Transaction } from "@/types/transaction";
import toast from "react-hot-toast";

export default function WalletView({ profile }: { profile: UserProfile }) {
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const { data: transactions = [], refetch } = useQuery({
    queryKey: ["transactions-my", filterType, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType) params.append("type", filterType);
      if (filterStatus) params.append("status", filterStatus);
      return (await api.get<Transaction[]>(`/api/transactions?${params.toString()}`)).data;
    },
  });

  const handleDeposit = async () => {
    try {
      const amount = prompt("Nhập số tiền bạn muốn nạp (VNĐ):", "100000");
      if (!amount) return;
      const numAmount = parseInt(amount);
      if (isNaN(numAmount) || numAmount < 10000) {
        toast.error("Số tiền nạp tối thiểu là 10.000 VNĐ");
        return;
      }

      const res = await api.post("/api/payment/create-url", { amount: numAmount });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      toast.error("Không thể tạo link nạp tiền");
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount < 50000) {
      toast.error("Số tiền rút tối thiểu là 50.000 VNĐ");
      return;
    }

    if (amount > Number(profile.balance)) {
      toast.error("Số dư không đủ để rút tiền");
      return;
    }

    try {
      setIsWithdrawing(true);
      await api.post("/api/transactions/withdraw", { amount });
      toast.success("Yêu cầu rút tiền đã được gửi. Chờ Admin phê duyệt.");
      setWithdrawAmount("");
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể thực hiện yêu cầu rút tiền");
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-h3 font-bold text-slate-900 dark:text-white">Ví của tôi</h1>
          <p className="text-slate-600 dark:text-slate-400 text-body mt-1">Quản lý số dư, nạp tiền và yêu cầu rút tiền.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDeposit}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-bold hover:shadow-lg transition-all"
          >
            <span className="material-symbols-outlined">payments</span>
            Nạp tiền
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Balance Card & Withdraw Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-primary rounded-2xl p-6 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-smaller font-bold opacity-80 uppercase tracking-widest">Tổng số dư</p>
              <h2 className="text-h3 font-bold mt-2">{formatVnd(Number(profile.balance))}</h2>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10 blur-xl scale-150">
              <span className="material-symbols-outlined text-[120px]">account_balance_wallet</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Rút tiền</h3>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block">Số tiền rút</label>
                <div className="relative">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="VD: 500000"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-smallaller focus:border-primary outline-none transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-smaller font-bold text-slate-400">VNĐ</span>
                </div>
              </div>
              <button
                disabled={isWithdrawing}
                type="submit"
                className="w-full py-3 rounded-xl border border-primary text-primary font-bold text-smaller hover:bg-primary/5 transition-all disabled:opacity-50"
              >
                {isWithdrawing ? "Đang xử lý..." : "Gửi yêu cầu rút"}
              </button>
            </form>
          </div>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Lịch sử giao dịch</h3>
            <div className="flex items-center gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-smaller outline-none"
              >
                <option value="">Tất cả loại</option>
                <option value="deposit">Nạp tiền</option>
                <option value="withdraw">Rút tiền</option>
                <option value="invest">Đầu tư</option>
                <option value="interest_receive">Lợi nhuận</option>
                <option value="refund">Hoàn tiền</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/20 text-[11px] uppercase text-slate-400 font-bold tracking-widest border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Giao dịch</th>
                  <th className="px-6 py-4">Số tiền</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Ngày</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-smaller font-bold text-slate-900 dark:text-white capitalize">{t.type.replace("_", " ")}</p>
                      <p className="text-[10px] text-slate-500 mt-1 italic max-w-[150px] truncate">{t.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className={`text-smaller font-extrabold ${['deposit', 'interest_receive', 'refund'].includes(t.type) ? 'text-green-600' : 'text-red-600'}`}>
                        {['deposit', 'interest_receive', 'refund'].includes(t.type) ? "+" : "-"}{formatVnd(Number(t.amount))}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        t.status === 'success' ? 'bg-green-500/10 text-green-600' : 
                        t.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : 
                        'bg-red-500/10 text-red-600'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] text-slate-500">{new Date(t.createdAt).toLocaleDateString('vi-VN')}</p>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500 text-smaller">Chưa có giao dịch nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
