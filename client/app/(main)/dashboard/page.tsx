"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";
import api from "@/lib/axios";

type UserProfile = {
  id: number;
  fullName: string;
  email: string;
  balance: number | string;
  role: string;
  createdAt: string;
};

type PaymentSchedule = {
  id: number;
  dueDate: string;
  amount: number | string;
  status: string;
  paidAt: string | null;
};

type Investment = {
  id: number;
  amount: number | string;
  status: string;
  investedAt: string;
  project: {
    id: number;
    title: string;
    slug: string;
    thumbnailUrl: string | null;
    interestRate: number | string;
    durationMonths: number;
  } | null;
  paymentSchedules: PaymentSchedule[];
};

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [profileRes, investmentsRes] = await Promise.all([
          api.get<UserProfile>("/auth/profile"),
          api.get<Investment[]>("/api/investments/my-investments"),
        ]);

        setUser(profileRes.data);
        setInvestments(investmentsRes.data);
      } catch {
        setError("Không thể tải dữ liệu dashboard.");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    void fetchDashboardData();
  }, [router]);

  const totalInvested = useMemo(
    () => investments.reduce((sum, item) => sum + Number(item.amount), 0),
    [investments],
  );

  const upcomingSchedules = useMemo(() => {
    return investments
      .flatMap((investment) =>
        investment.paymentSchedules.map((schedule) => ({
          ...schedule,
          projectTitle: investment.project?.title ?? "Dự án",
        })),
      )
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      )
      .slice(0, 12);
  }, [investments]);

  if (loading) {
    return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
        <Navbar />
        <main className="wrapper wrapper--lg py-12 animate-pulse space-y-6">
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
          <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </main>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
        <Navbar />
        <main className="wrapper wrapper--lg py-16 text-red-500">{error || "Vui lòng đăng nhập lại."}</main>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />
      <main className="wrapper wrapper--lg py-12 space-y-10">
        <section>
          <h1 className="text-h2 font-bold text-slate-900 dark:text-white mb-2">
            Chào mừng trở lại, <span className="text-primary">{user.fullName}</span>
          </h1>
          <p className="text-body text-slate-600 dark:text-slate-400">
            Tổng quan tài sản và các khoản đầu tư của bạn.
          </p>
          <div className="mt-4">
            <a
              href="/dashboard/deposit"
              className="inline-flex px-5 py-2 rounded-lg bg-primary text-white text-smaller font-bold"
            >
              Nạp tiền qua VNPay
            </a>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <p className="text-smaller text-slate-500 mb-1">Số dư ví</p>
            <p className="text-h4 font-bold text-green-600 dark:text-green-400">
              {Number(user.balance).toLocaleString("vi-VN")} đ
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <p className="text-smaller text-slate-500 mb-1">Số khoản đầu tư</p>
            <p className="text-h4 font-bold text-slate-900 dark:text-white">{investments.length}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <p className="text-smaller text-slate-500 mb-1">Tổng đã đầu tư</p>
            <p className="text-h4 font-bold text-slate-900 dark:text-white">
              {Number(totalInvested).toLocaleString("vi-VN")} đ
            </p>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-h5 font-bold text-slate-900 dark:text-white mb-4">Danh sách khoản đầu tư</h2>

          {investments.length === 0 ? (
            <p className="text-smaller text-slate-500">Bạn chưa có khoản đầu tư nào.</p>
          ) : (
            <div className="space-y-3">
              {investments.map((investment) => (
                <div
                  key={investment.id}
                  className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {investment.project?.title || "Dự án"}
                    </p>
                    <p className="text-smaller text-slate-500">
                      Đầu tư ngày {new Date(investment.investedAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-primary">
                      {Number(investment.amount).toLocaleString("vi-VN")} đ
                    </p>
                    <p className="text-smaller text-slate-500">{investment.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-h5 font-bold text-slate-900 dark:text-white mb-4">Lịch trả lãi</h2>

          {upcomingSchedules.length === 0 ? (
            <p className="text-smaller text-slate-500">Chưa có lịch trả lãi.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2 pr-4">Dự án</th>
                    <th className="py-2 pr-4">Ngày trả</th>
                    <th className="py-2 pr-4">Số tiền</th>
                    <th className="py-2">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingSchedules.map((schedule) => (
                    <tr key={schedule.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-4">{schedule.projectTitle}</td>
                      <td className="py-2 pr-4">
                        {new Date(schedule.dueDate).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="py-2 pr-4">{Number(schedule.amount).toLocaleString("vi-VN")} đ</td>
                      <td className="py-2">{schedule.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
