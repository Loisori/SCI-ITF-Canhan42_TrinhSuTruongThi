"use client";

import { type Dispatch, type SetStateAction, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { formatVnd } from "@/lib/utils";
import { UserProfile } from "@/types/user";
import { Transaction } from "@/types/transaction";
import toast from "react-hot-toast";
import {
  Banknote,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  X,
} from "lucide-react";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { motion, AnimatePresence } from "framer-motion";
import { DepositModal, WithdrawModal } from "../modals/FintechModals";
import { useKycCheck } from "@/lib/hooks/useKycCheck";

const positiveTransactionTypes = [
  "deposit",
  "interest_receive",
  "refund",
  "disbursement",
  "system_fee",
];

const getTransactionTypeLabel = (type: string) => {
  if (type === "deposit") return "Nạp tiền";
  if (type === "withdrawal") return "Rút tiền";
  if (type === "invest") return "Đầu tư";
  if (type === "interest_receive") return "Nhận Lợi nhuận";
  if (type === "refund") return "Hoàn tiền";
  if (type === "disbursement") return "Nhận Giải Ngân";
  if (type === "repay_interest") return "Trả Lãi";
  if (type === "repay_principal") return "Trả Gốc";
  if (type === "system_fee") return "Phí Hệ Thống";
  return type;
};

const getTransactionStatusLabel = (status: string) => {
  if (status === "success") return "Thành công";
  if (status === "pending") return "Đang chờ";
  if (status === "failed") return "Thất bại";
  return status;
};

export default function WalletView({ profile }: { profile: UserProfile }) {
  const { isKycApproved, isFrozen } = useKycCheck();
  // Ensure balance is synchronized with profile
  const [showDepositModal, setShowDepositModal] = useState(false);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  const [filterType, setFilterType] = useState<string>("");
  const filterStatus = "";
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: transactions = [], refetch } = useQuery({
    queryKey: ["transactions-my", filterType, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType) params.append("type", filterType);
      if (filterStatus) params.append("status", filterStatus);
      return (
        await api.get<Transaction[]>(`/api/transactions?${params.toString()}`)
      ).data;
    },
  });

  // Pagination logic
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Reset to first page when filters change
  const handleFilterChange = (
    setter: Dispatch<SetStateAction<string>>,
    value: string,
  ) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép!");
  };

  // Calculate total deposits and withdrawals
  const totalDeposits = transactions
    .filter((t) => t.type === "deposit" && t.status === "success")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalWithdrawals = transactions
    .filter((t) => t.type === "withdrawal" && t.status === "success")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-h3 font-bold text-slate-900 dark:text-white">
            Ví của tôi
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-body mt-1">
            Quản lý số dư, nạp tiền và yêu cầu rút tiền.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              isFrozen
                ? toast.error("Tài khoản bị đóng băng - Không thể nạp tiền.")
                : setShowDepositModal(true)
            }
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
              isFrozen
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-primary text-white hover:shadow-lg"
            }`}
          >
            <Banknote className="size-5" />
            Nạp tiền
          </button>
          <button
            onClick={() => {
              if (isFrozen)
                return toast.error(
                  "Tài khoản bị đóng băng - Không thể rút tiền.",
                );
              if (!isKycApproved)
                return toast.error(
                  "Yêu cầu KYC: Bạn cần được Admin phê duyệt KYC mới có thể rút tiền.",
                );
              setShowWithdrawModal(true);
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
              isFrozen
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "border border-primary text-primary hover:bg-primary/5"
            }`}
          >
            <ArrowUpRight className="w-5 h-5" />
            Rút tiền
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Balance Card Section */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <p className="text-smaller font-bold opacity-60 uppercase tracking-widest mb-2">
                Số dư hiện tại
              </p>
              <h2 className="text-h3 md:text-[64px] font-black tracking-tight leading-none">
                <AnimatedNumber value={Number(profile.balance)} />
              </h2>
            </div>
            <div className="flex gap-4">
              <div className="px-6 py-4 rounded-5 bg-white/5 border border-white/10 backdrop-blur-md">
                <p className="text-[10px] font-bold opacity-50 uppercase mb-1">
                  Tổng nạp
                </p>
                <p className="text-base font-bold text-green-400">
                  +{formatVnd(totalDeposits)}
                </p>
              </div>
              <div className="px-6 py-4 rounded-5 bg-white/5 border border-white/10 backdrop-blur-md">
                <p className="text-[10px] font-bold opacity-50 uppercase mb-1">
                  Tổng rút
                </p>
                <p className="text-base font-bold text-red-400">
                  -{formatVnd(totalWithdrawals)}
                </p>
              </div>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
            <Wallet className="size-120" />
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="bg-white dark:bg-slate-900 rounded-5 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex flex-wrap items-center justify-between gap-4 bg-slate-50/30 dark:bg-white/5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Lịch sử giao dịch
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={filterType}
                onChange={(e) =>
                  handleFilterChange(setFilterType, e.target.value)
                }
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-smaller outline-none focus:ring-2 ring-primary/20"
              >
                <option value="">Tất cả loại</option>
                <option value="deposit">Nạp tiền</option>
                <option value="withdrawal">Rút tiền</option>
                <option value="invest">Đầu tư</option>
                <option value="interest_receive">Nhận Lợi nhuận</option>
                <option value="disbursement">Nhận Giải ngân</option>
                <option value="repay_interest">Trả Lãi</option>
                <option value="repay_principal">Trả Gốc</option>
                <option value="system_fee">Phí Hệ thống</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/20 text-[11px] uppercase text-slate-400 font-bold tracking-widest border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Giao dịch</th>
                  <th className="px-6 py-4 text-center">Số tiền</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedTransactions.map((t) => {
                  const isPositive = positiveTransactionTypes.includes(t.type);
                  const displayType = getTransactionTypeLabel(t.type);

                  return (
                    <tr
                      key={t.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedTransaction(t)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedTransaction(t);
                        }
                      }}
                      className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all group cursor-pointer focus:outline-none focus:bg-slate-50 dark:focus:bg-white/5"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                              isPositive
                                ? "bg-green-500/10 text-green-600"
                                : "bg-red-500/10 text-red-600"
                            }`}
                          >
                            {isPositive ? (
                              <ArrowDownLeft className="w-5 h-5" />
                            ) : (
                              <ArrowUpRight className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <p className="text-smaller font-bold text-slate-900 dark:text-white capitalize leading-tight">
                              {displayType}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 opacity-70 italic">
                              {t.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <p
                          className={`text-base font-black tracking-tight ${isPositive ? "text-green-600" : "text-slate-900 dark:text-white"}`}
                        >
                          {isPositive ? "+" : "-"}
                          {Number(t.amount).toLocaleString("vi-VN")}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            t.status === "success"
                              ? "bg-green-500 text-white"
                              : t.status === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <p className="text-[11px] font-bold text-slate-500">
                          {new Date(t.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(t.createdAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </td>
                    </tr>
                  );
                })}

                {transactions.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-10 text-center text-slate-500 text-smaller"
                    >
                      Chưa có giao dịch nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {transactions.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-white/5">
              <p className="text-smaller text-slate-600 dark:text-slate-400">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{" "}
                {Math.min(currentPage * itemsPerPage, transactions.length)}{" "}
                trong {transactions.length} giao dịch
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-smaller font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                >
                  ← Trước
                </button>
                <span className="text-smaller font-semibold text-slate-600 dark:text-slate-400 px-2">
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-smaller font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onRefresh={refetch}
      />
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        balance={Number(profile.balance)}
        onRefresh={() => {
          refetch();
          // Also refetch profile to show updated balance after withdrawal deduction
          window.dispatchEvent(new CustomEvent("profile-update"));
        }}
      />

      <AnimatePresence>
        {selectedTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Chi tiết giao dịch
                  </p>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {getTransactionTypeLabel(selectedTransaction.type)}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Đóng chi tiết giao dịch"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 dark:bg-white/5 p-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Số tiền
                    </p>
                    <p
                      className={`mt-1 text-2xl font-black ${
                        positiveTransactionTypes.includes(
                          selectedTransaction.type,
                        )
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {positiveTransactionTypes.includes(
                        selectedTransaction.type,
                      )
                        ? "+"
                        : "-"}
                      {formatVnd(Number(selectedTransaction.amount))}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      selectedTransaction.status === "success"
                        ? "bg-green-500 text-white"
                        : selectedTransaction.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {getTransactionStatusLabel(selectedTransaction.status)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Mã giao dịch
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        #{selectedTransaction.id}
                      </p>
                      <button
                        onClick={() => handleCopy(String(selectedTransaction.id))}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                        aria-label="Sao chép mã giao dịch"
                      >
                        <Copy className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Mã tham chiếu
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedTransaction.referenceId
                        ? `#${selectedTransaction.referenceId}`
                        : "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Loại giao dịch
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {getTransactionTypeLabel(selectedTransaction.type)}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {selectedTransaction.type}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Trạng thái
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {getTransactionStatusLabel(selectedTransaction.status)}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {selectedTransaction.status}
                    </p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Thời gian
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {new Date(selectedTransaction.createdAt).toLocaleString(
                        "vi-VN",
                      )}
                    </p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Mô tả
                    </p>
                    <p className="text-sm leading-6 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {selectedTransaction.description || "-"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
