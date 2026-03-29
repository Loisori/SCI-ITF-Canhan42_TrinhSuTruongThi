"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";
import api from "@/lib/axios";

export default function DepositPage() {
  const router = useRouter();
  const [amount, setAmount] = useState(100000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeposit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post<{ vnpayUrl: string }>(
        "/api/payment/create-url",
        { amount: Number(amount) },
      );

      window.location.href = response.data.vnpayUrl;
    } catch (err: unknown) {
      const message =
        (
          err as {
            response?: { data?: { message?: string | string[] } };
          }
        )?.response?.data?.message ?? "Không thể tạo link thanh toán VNPay.";
      setError(Array.isArray(message) ? message[0] : message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />
      <main className="wrapper wrapper--sm py-12">
        <h1 className="text-h3 font-bold text-slate-900 dark:text-white mb-2">
          Nạp tiền qua VNPay
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Nhập số tiền muốn nạp vào ví InvestPro.
        </p>

        <form
          onSubmit={handleDeposit}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5"
        >
          <div>
            <label className="block text-smaller font-semibold mb-2">
              Số tiền (VND)
            </label>
            <input
              type="number"
              min={1000}
              step="1000"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
              required
            />
          </div>

          {error && <p className="text-small text-red-500">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-primary text-white font-bold disabled:opacity-60"
            >
              {loading ? "Đang chuyển hướng..." : "Nạp tiền qua VNPay"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold"
            >
              Quay lại
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
