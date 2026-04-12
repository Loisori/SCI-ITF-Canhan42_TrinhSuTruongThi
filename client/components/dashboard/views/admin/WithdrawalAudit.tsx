"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { formatVnd } from "@/lib/utils";
import toast from "react-hot-toast";
import { Banknote, CheckCircle2, Landmark, User, Clock, AlertCircle } from "lucide-react";

interface WithdrawalRequest {
  id: number;
  amount: number;
  status: string;
  description: string;
  bankName: string;
  accountNumber: string;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
  };
}

export default function WithdrawalAudit() {
  const { data: requests = [], refetch } = useQuery({
    queryKey: ["admin-pending-withdrawals"],
    queryFn: async () => (await api.get<WithdrawalRequest[]>("/api/wallets/admin/pending-transactions")).data.filter(t => t.status === 'pending'),
  });

  const handleApprove = async (id: number) => {
    if (!confirm("Bạn xác nhận đã thực hiện chuyển khoản cho người dùng này? Thao tác này sẽ đánh dấu giao dịch là THÀNH CÔNG.")) return;
    try {
      await api.post(`/api/wallets/admin/approve-transaction/${id}`);
      toast.success("Đã xác nhận thanh toán thành công.");
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi xác nhận");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-h3 font-black text-slate-900 dark:text-white">Duyệt Rút tiền</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Xác nhận các lệnh rút tiền sau khi đã chuyển khoản thủ công.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {requests.map((r) => (
          <div key={r.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between gap-8">
              <div className="space-y-6 flex-1">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{r.user.fullName}</p>
                    <p className="text-[11px] font-bold text-slate-500 uppercase">{r.user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Số tiền rút</p>
                    <p className="text-xl font-black text-primary">{formatVnd(Number(r.amount))}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Thời gian yêu cầu</p>
                    <p className="text-smaller font-bold text-slate-700 dark:text-slate-300">
                      {new Date(r.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-4">
                  <Landmark className="w-6 h-6 text-amber-600 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-smaller font-black text-amber-900 dark:text-amber-400 uppercase">Thông tin thụ hưởng</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">Ngân hàng: {r.bankName || "N/A"}</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">Số tài khoản: {r.accountNumber || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center items-center md:items-end gap-4 md:w-64 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-8 md:pt-0 md:pl-8">
                <button
                  onClick={() => handleApprove(r.id)}
                  className="w-full py-4 bg-green-600 text-white font-black rounded-2xl shadow-xl shadow-green-600/20 hover:scale-[1.05] transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Mark as Paid
                </button>
                <p className="text-[10px] text-slate-400 font-medium text-center italic">
                  Chỉ bấm sau khi bạn đã thực hiện chuyển khoản thành công ngoài hệ thống.
                </p>
              </div>
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div className="py-20 text-center bg-slate-50 dark:bg-slate-950 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
             <Banknote className="w-16 h-16 text-slate-200 mx-auto mb-4" />
             <p className="text-slate-500 font-bold">Không có yêu cầu rút tiền nào đang chờ duyệt.</p>
          </div>
        )}
      </div>
    </div>
  );
}
