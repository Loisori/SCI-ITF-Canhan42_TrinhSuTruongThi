"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, CheckCircle2, AlertCircle, Banknote, Landmark } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <div className="p-6">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export const DepositModal = ({ isOpen, onClose, onRefresh }: { isOpen: boolean; onClose: () => void; onRefresh: () => void }) => {
  const [amount, setAmount] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const bankAccount = "1234567890";
  const bankName = "Techcombank";
  const accountName = "CONG TY INVESTPRO";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseInt(amount) < 100000) {
      toast.error("Số tiền tối thiểu là 100.000 VNĐ");
      return;
    }

    try {
      setLoading(true);
      await api.post("/api/wallets/deposit", { amount: parseInt(amount) });
      setIsDone(true);
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi nạp tiền");
    } finally {
      setLoading(false);
    }
  };

  if (isDone) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Yêu cầu thành công">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h4 className="text-lg font-bold">Lệnh nạp đã được gửi!</h4>
          <p className="text-smaller text-slate-500">
            Vui lòng thực hiện chuyển khoản theo thông tin đã cung cấp. Số dư sẽ được cập nhật sau khi Admin xác nhận.
          </p>
          <button onClick={onClose} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl mt-4">
            Đóng
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nạp tiền vào ví">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-[11px] text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
            Hệ thống đang trong giai đoạn thử nghiệm. Vui lòng chuyển khoản vào tài khoản bên dưới và nhấn "Xác nhận đã chuyển".
          </p>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Ngân hàng</span>
              <span className="text-smaller font-bold">{bankName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Số tài khoản</span>
              <div className="flex items-center gap-2">
                <span className="text-smaller font-bold">{bankAccount}</span>
                <button type="button" onClick={() => handleCopy(bankAccount)} className="p-1 hover:bg-white rounded transition-colors">
                  <Copy className="w-3 h-3 text-primary" />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Chủ tài khoản</span>
              <span className="text-smaller font-bold">{accountName}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block">Số tiền nạp (VNĐ)</label>
          <input
            autoFocus
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="VD: 1000000"
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 focus:border-primary outline-none transition-all font-black text-xl"
          />
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full py-4 bg-primary text-white font-black rounded-2xl hover:shadow-xl hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
        >
          {loading ? "Đang xử lý..." : "Xác nhận đã chuyển khoản"}
        </button>
      </form>
    </Modal>
  );
};

export const WithdrawModal = ({ isOpen, onClose, balance, onRefresh }: { isOpen: boolean; onClose: () => void; balance: number; onRefresh: () => void }) => {
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(amount);
    if (!val || val < 50000) {
      toast.error("Số tiền rút tối thiểu là 50.000 VNĐ");
      return;
    }
    if (!bankName || !accountNumber) {
      toast.error("Vui lòng nhập thông tin ngân hàng");
      return;
    }
    if (val > balance) {
      toast.error("Số dư không đủ");
      return;
    }

    try {
      setLoading(true);
      await api.post("/api/wallets/withdraw", { 
        amount: val,
        bankName,
        accountNumber
      });
      toast.success("Yêu cầu rút tiền đã được gửi! Chờ Admin duyệt.");
      onRefresh();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi rút tiền");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rút tiền về ngân hàng">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Số dư khả dụng</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{balance.toLocaleString('vi-VN')} ₫</p>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block">Số tiền muốn rút</label>
          <input
            autoFocus
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="VD: 500000"
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 focus:border-red-500 outline-none transition-all font-black text-xl"
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
           <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block">Tên ngân hàng</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="VD: Techcombank"
                className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:border-red-500 outline-none transition-all font-bold"
              />
           </div>
           <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block">Số tài khoản</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Nhập số tài khoản"
                className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:border-red-500 outline-none transition-all font-bold"
              />
           </div>
        </div>


        <button
          disabled={loading}
          type="submit"
          className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:shadow-xl hover:shadow-red-500/20 transition-all"
        >
          {loading ? "Đang xử lý..." : "Gửi yêu cầu rút"}
        </button>
      </form>
    </Modal>
  );
};
