"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { formatVnd } from "@/lib/utils";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  CheckCircle2,
  Landmark,
  User,
} from "lucide-react";

interface WithdrawalRequest {
  id: number;
  amount: number;
  type: "deposit" | "withdrawal" | string;
  status: string;
  description: string;
  bankName: string | null;
  accountNumber: string | null;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
  };
}

const getTransactionMeta = (type: WithdrawalRequest["type"]) => {
  if (type === "deposit") {
    return {
      label: "Nạp tiền",
      amountLabel: "Số tiền nạp",
      Icon: ArrowDownToLine,
      tone:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
      amountClass: "text-emerald-600 dark:text-emerald-400",
      confirm:
        "Bạn xác nhận đã nhận tiền nạp từ người dùng này? Thao tác này sẽ cộng tiền vào ví và đánh dấu giao dịch là THÀNH CÔNG.",
      button: "Xác nhận nạp",
    };
  }

  return {
    label: "Rút tiền",
    amountLabel: "Số tiền rút",
    Icon: ArrowUpFromLine,
    tone:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
    amountClass: "text-red-600 dark:text-red-400",
    confirm:
      "Bạn xác nhận đã thực hiện chuyển khoản cho người dùng này? Thao tác này sẽ đánh dấu giao dịch là THÀNH CÔNG.",
    button: "Xác nhận rút",
  };
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback;
  }

  return fallback;
};

export default function WithdrawalAudit() {
  const { data: requests = [], refetch } = useQuery({
    queryKey: ["admin-pending-withdrawals"],
    queryFn: async () =>
      (
        await api.get<WithdrawalRequest[]>(
          "/api/wallets/admin/pending-transactions",
        )
      ).data.filter((t) => t.status === "pending"),
  });

  const handleApprove = async (id: number) => {
    const request = requests.find((r) => r.id === id);
    if (
      !confirm(
        request
          ? getTransactionMeta(request.type).confirm
          : "Bạn xác nhận duyệt giao dịch này?",
      )
    )
      return;
    try {
      await api.post(`/api/wallets/admin/approve-transaction/${id}`);
      toast.success("Đã xác nhận giao dịch thành công.");
      refetch();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Lỗi xác nhận"));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-h3 font-black text-slate-900 dark:text-white">
          Duyệt giao dịch ví
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Xác nhận rõ từng yêu cầu nạp hoặc rút tiền đang chờ xử lý.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {requests.map((r) => {
          const meta = getTransactionMeta(r.type);
          const TypeIcon = meta.Icon;

          return (
            <div
              key={r.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm"
            >
              <div className="flex flex-col md:flex-row justify-between gap-8">
                <div className="space-y-6 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-5 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                          {r.user.fullName}
                        </p>
                        <p className="text-[11px] font-bold text-slate-500 uppercase">
                          {r.user.email}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`w-fit inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-wider ${meta.tone}`}
                    >
                      <TypeIcon className="w-4 h-4" />
                      {meta.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        {meta.amountLabel}
                      </p>
                      <p className={`text-xl font-black ${meta.amountClass}`}>
                        {r.type === "deposit" ? "+" : "-"}
                        {formatVnd(Number(r.amount))}
                      </p>
                    </div>
                    <div className="p-4 rounded-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Thời gian yêu cầu
                      </p>
                      <p className="text-smaller font-bold text-slate-700 dark:text-slate-300">
                        {new Date(r.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>

                  {r.type === "withdrawal" ? (
                    <div className="p-6 rounded-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-4">
                      <Landmark className="w-6 h-6 text-amber-600 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-smaller font-black text-amber-900 dark:text-amber-400 uppercase">
                          Thông tin thụ hưởng
                        </p>
                        <p className="text-base font-bold text-slate-900 dark:text-white">
                          Ngân hàng: {r.bankName || "N/A"}
                        </p>
                        <p className="text-base font-bold text-slate-900 dark:text-white">
                          Số tài khoản: {r.accountNumber || "N/A"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-start gap-4">
                      <TypeIcon className="w-6 h-6 text-emerald-600 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-smaller font-black text-emerald-900 dark:text-emerald-400 uppercase">
                          Yêu cầu nạp tiền
                        </p>
                        <p className="text-base font-bold text-slate-900 dark:text-white">
                          {r.description || "Người dùng yêu cầu nạp tiền vào ví"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-center items-center md:items-end gap-4 md:w-64 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-8 md:pt-0 md:pl-8">
                  <button
                    onClick={() => handleApprove(r.id)}
                    className="w-full py-4 bg-green-600 text-white font-black rounded-5 shadow-xl shadow-green-600/20 hover:scale-[1.05] transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {meta.button}
                  </button>
                  <p className="text-[10px] text-slate-400 font-medium text-center italic">
                    {r.type === "withdrawal"
                      ? "Chỉ bấm sau khi bạn đã thực hiện chuyển khoản thành công ngoài hệ thống."
                      : "Chỉ bấm sau khi bạn đã xác nhận tiền nạp đã về tài khoản hệ thống."}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {requests.length === 0 && (
          <div className="py-20 text-center bg-slate-50 dark:bg-slate-950 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <Banknote className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-bold">
              Không có yêu cầu nạp/rút tiền nào đang chờ duyệt.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
