"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { formatVnd } from "@/lib/utils";
import { UserProfile } from "@/types/user";
import toast from "react-hot-toast";
import { Calendar, CircleDollarSign, Info, ShieldCheck, Landmark, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RepaymentSchedule {
  projectId: number;
  projectTitle: string;
  dueDate: string;
  representativeScheduleId: number;
  totalAmount: number;
  investorCount: number;
}

export default function RepaymentView({ profile }: { profile: UserProfile }) {
  const [isRepaying, setIsRepaying] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<RepaymentSchedule | null>(null);

  const { data: schedules = [], refetch } = useQuery({
    queryKey: ["owner-repayment-schedules"],
    queryFn: async () => (await api.get<RepaymentSchedule[]>("/api/wallets/repayments/schedules")).data,
  });

  const handleRepay = async () => {
    if (!selectedSchedule) return;

    try {
      setIsRepaying(true);
      await api.post("/api/wallets/repay", { scheduleId: selectedSchedule.representativeScheduleId });
      toast.success("Thanh toán lãi kỳ hạn thành công!");
      setSelectedSchedule(null);
      refetch();
      // Update sidebar balance
      window.dispatchEvent(new CustomEvent('profile-update'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi thanh toán");
    } finally {
      setIsRepaying(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-h3 font-black text-slate-900 dark:text-white">Quản lý Thanh toán</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Theo dõi và tất toán các kỳ hạn lãi dự án của bạn.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {schedules.map((s) => (
          <div key={`${s.projectId}_${s.dueDate}`} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm group hover:border-primary transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
                  <Calendar className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">{s.projectTitle}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-smaller font-bold text-slate-500 flex items-center gap-1">
                      Kỳ hạn: <span className="text-slate-900 dark:text-white">{new Date(s.dueDate).toLocaleDateString('vi-VN')}</span>
                    </p>
                    <p className="text-smaller font-bold text-slate-500 flex items-center gap-1">
                      Nhà đầu tư: <span className="text-slate-900 dark:text-white">{s.investorCount}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-8">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Tổng thanh toán</p>
                  <p className="text-2xl font-black text-primary mt-1">{formatVnd(s.totalAmount)}</p>
                </div>
                <button
                  onClick={() => setSelectedSchedule(s)}
                  className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Thanh toán ngay
                </button>
              </div>
            </div>
          </div>
        ))}

        {schedules.length === 0 && (
          <div className="py-20 text-center bg-slate-50 dark:bg-slate-950 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
             <CircleDollarSign className="w-16 h-16 text-slate-200 mx-auto mb-4" />
             <p className="text-slate-500 font-bold">Hiện không có kỳ hạn nào cần thanh toán.</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {selectedSchedule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <button onClick={() => setSelectedSchedule(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-all">
                    <X />
                  </button>
                </div>

                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-primary">Xác nhận thanh toán?</h3>
                  <p className="text-slate-500 font-medium">Bạn đang thực hiện thanh toán lãi kỳ hạn cho tất cả nhà đầu tư của dự án <strong>{selectedSchedule.projectTitle}</strong>.</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 space-y-4">
                  <div className="flex justify-between items-center text-smaller">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">Kỳ hạn nợ</span>
                    <span className="text-slate-900 dark:text-white font-black">{new Date(selectedSchedule.dueDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-smaller">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">Số lượng nhà đầu tư</span>
                    <span className="text-slate-900 dark:text-white font-black">{selectedSchedule.investorCount} Người</span>
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-slate-700" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Tổng chi (Gốc + Lãi)</span>
                    <span className="text-2xl font-black text-primary">{formatVnd(selectedSchedule.totalAmount)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
                  <Info className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-[11px] text-amber-800 dark:text-amber-400 font-bold leading-relaxed">
                    Số tiền này sẽ được trừ trực tiếp vào ví InvestPro của bạn và chuyển ngay lập tức cho các nhà đầu tư. Không thể hoàn tác sau khi thực hiện.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedSchedule(null)}
                    className="flex-1 py-4 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-black rounded-2xl hover:bg-slate-50 transition-all"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    disabled={isRepaying}
                    onClick={handleRepay}
                    className="flex-1 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <Landmark className="w-5 h-5" />
                    {isRepaying ? "Đang xử lý..." : "Xác nhận trả nợ"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
