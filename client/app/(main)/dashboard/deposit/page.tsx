"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";
import api from "@/lib/axios";
import { Banknote, Landmark, Wallet, CircleAlert, ShieldCheck } from "lucide-react";

export default function DepositPage() {
  const router = useRouter();
  const [amount, setAmount] = useState(100000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Payment methods: vnpay, bank, momo
  const [selectedMethod, setSelectedMethod] = useState<string>("vnpay");

  const handleDeposit = async (e: FormEvent) => {
    e.preventDefault();
    if (!["vnpay", "momo"].includes(selectedMethod)) return; // Safety check
    
    setError(null);
    setLoading(true);

    try {
      if (selectedMethod === "vnpay") {
        const response = await api.post<{ vnpayUrl: string }>(
          "/api/payment/create-url",
          { amount: Number(amount) },
        );
        window.location.href = response.data.vnpayUrl;
      } else if (selectedMethod === "momo") {
        const response = await api.post<{ momoUrl: string }>(
          "/api/payment/create-momo-url",
          { amount: Number(amount) },
        );
        window.location.href = response.data.momoUrl;
      }
    } catch (err: unknown) {
      const message =
        (
          err as {
            response?: { data?: { message?: string | string[] } };
          }
        )?.response?.data?.message ?? "Không thể tạo link thanh toán.";
      setError(Array.isArray(message) ? message[0] : message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />
      <main className="wrapper wrapper--sm py-12">
        <h1 className="text-h3 font-bold text-slate-900 dark:text-white mb-2">
          Nạp tiền vào ví InvestPro
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xl">
          Quy trình nạp tiền tuân thủ điều kiện an toàn và chuẩn xác thức eKYC. Số tiền sẽ tự động trừ phí và cộng dồn vào ví của bạn sau khi hoàn tất.
        </p>

        <form
          onSubmit={handleDeposit}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 space-y-8"
        >
          {/* Amount Selection */}
          <div>
            <label className="block text-body font-bold text-slate-700 dark:text-slate-200 mb-3">
              1. Nhập số tiền cần nạp (VND)
            </label>
            <div className="relative">
              <input
                type="number"
                min={10000}
                step="10000"
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
                className="w-full px-5 py-4 text-h5 font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                required
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                VNĐ
              </span>
            </div>
            <p className="text-smaller text-slate-500 mt-2">Tối thiểu: 10,000 VNĐ</p>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-body font-bold text-slate-700 dark:text-slate-200 mb-3">
              2. Chọn phương thức thanh toán
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* VNPay Option - Active */}
              <div 
                onClick={() => setSelectedMethod("vnpay")}
                className={`flex flex-col p-5 rounded-xl border-2 cursor-pointer transition-all ${selectedMethod === 'vnpay' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <Banknote className="text-primary text-[28px]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Khuyên dùng</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Cổng VNPay</h3>
                <p className="text-smaller text-slate-500 mt-1">Quét mã QR, Thẻ ATM nội địa, Thẻ quốc tế Visa/Mastercard.</p>
              </div>

              {/* Bank Transfer Option - Disabled mock */}
              <div 
                className="flex flex-col p-5 rounded-xl border-2 border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <Landmark className="text-slate-500 text-[28px]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">Bảo trì</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Chuyển khoản thủ công</h3>
                <p className="text-smaller text-slate-500 mt-1">Hệ thống chuyển khoản ngân hàng đang được chúng tôi nâng cấp.</p>
              </div>

              {/* MoMo Option - Active */}
              <div 
                onClick={() => setSelectedMethod("momo")}
                className={`flex flex-col p-5 rounded-xl border-2 cursor-pointer transition-all ${selectedMethod === 'momo' ? 'border-[#a50064] bg-[#a50064]/5' : 'border-slate-200 dark:border-slate-700 hover:border-[#a50064]/50'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <Wallet className="text-[#a50064] text-[28px]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Mới</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Ví điện tử MoMo</h3>
                <p className="text-smaller text-slate-500 mt-1">Hỗ trợ giao dịch nhanh và an toàn trực tiếp qua ví MoMo.</p>
              </div>

            </div>
          </div>

            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 text-red-600 text-smaller p-4 rounded-xl flex items-center gap-2">
              <CircleAlert />
              <p>{error}</p>
            </div>

          <div className="flex items-center gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={loading || !["vnpay", "momo"].includes(selectedMethod)}
              className="px-8 py-3 rounded-xl bg-primary text-white font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:hover:shadow-none"
            >
              {loading ? "Đang chuyển hướng..." : "Tiếp tục thanh toán"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard?tab=wallet")}
              className="px-8 py-3 rounded-xl border border-slate-300 dark:border-slate-700 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
          </div>
        </form>

        <div className="mt-8 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl text-smaller text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="text-[18px]" />
          Giao dịch được mã hóa 256-bit và bảo mật bởi ngân hàng nhà nước Việt Nam.
        </div>
      </main>
      <Footer />
    </div>
  );
}
