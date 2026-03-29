"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";
import api from "@/lib/axios";
import { Transaction } from "@/types/transaction";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.get<Transaction[]>("/api/transactions");
        setTransactions(res.data);
      } catch {
        setError("Không thể tải lịch sử giao dịch.");
      } finally {
        setLoading(false);
      }
    };

    void fetchTransactions();
  }, []);

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />

      <main className="wrapper wrapper--lg py-12">
        <h1 className="text-h3 font-bold text-slate-900 dark:text-white mb-6">
          Nhật ký giao dịch
        </h1>

        {loading && (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-12 rounded-lg bg-slate-200 dark:bg-slate-800"
              />
            ))}
          </div>
        )}

        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-small text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3">Ngày</th>
                  <th className="px-4 py-3">Loại</th>
                  <th className="px-4 py-3">Số tiền</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Mô tả</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-slate-100 dark:border-slate-800"
                  >
                    <td className="px-4 py-3">
                      {new Date(transaction.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 uppercase">{transaction.type}</td>
                    <td className="px-4 py-3 font-semibold">
                      {Number(transaction.amount).toLocaleString("vi-VN")} đ
                    </td>
                    <td className="px-4 py-3">{transaction.status}</td>
                    <td className="px-4 py-3">
                      {transaction.description || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
