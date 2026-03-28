"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import axios from "axios";
import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";

interface User {
  id: string;
  fullName: string;
  email: string;
  balance: number;
  role: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = Cookies.get("access_token");

        // Redirect to login if no token
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await axios.get<User>(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        setUser(response.data);
        setLoading(false);
      } catch (err) {
        // Token expired or invalid
        Cookies.remove("access_token", { path: "/" });
        setError("Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.");
        setLoading(false);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    };

    fetchUserProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
        <Navbar />
        <main className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Đang tải...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
        <Navbar />
        <main className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <p className="text-slate-600 dark:text-slate-400 text-smaller">
              Chuyển hướng đến trang đăng nhập...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />
      <main className="wrapper wrapper--lg py-12">
        {/* Greeting Section */}
        <section className="mb-12">
          <h1 className="text-h2 font-bold text-slate-900 dark:text-white mb-2">
            Chào mừng trở lại,{" "}
            <span className="text-primary">{user?.fullName}!</span>
          </h1>
          <p className="text-body text-slate-600 dark:text-slate-400">
            Quản lý tài chính và theo dõi các khoản đầu tư của bạn
          </p>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Balance */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-smaller font-semibold text-slate-600 dark:text-slate-400">
                Số dư hiện tại
              </h3>
              <span className="material-symbols-outlined text-primary text-xl">
                account_balance_wallet
              </span>
            </div>
            <p className="text-h4 font-bold text-slate-900 dark:text-white">
              ${Number(user?.balance).toLocaleString()}
            </p>
            <p className="text-smallest text-green-600 dark:text-green-400 mt-2">
              +5.2% từ tuần trước
            </p>
          </div>

          {/* Investments */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-smaller font-semibold text-slate-600 dark:text-slate-400">
                Số dự án đầu tư
              </h3>
              <span className="material-symbols-outlined text-blue-500 text-xl">
                trending_up
              </span>
            </div>
            <p className="text-h4 font-bold text-slate-900 dark:text-white">
              3
            </p>
            <p className="text-smallest text-slate-500 dark:text-slate-400 mt-2">
              Đang theo dõi
            </p>
          </div>

          {/* Total Invested */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-smaller font-semibold text-slate-600 dark:text-slate-400">
                Tổng đã đầu tư
              </h3>
              <span className="material-symbols-outlined text-orange-500 text-xl">
                money
              </span>
            </div>
            <p className="text-h4 font-bold text-slate-900 dark:text-white">
              $45,000
            </p>
            <p className="text-smallest text-slate-500 dark:text-slate-400 mt-2">
              Từ 6 tháng trước
            </p>
          </div>

          {/* Returns */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-smaller font-semibold text-slate-600 dark:text-slate-400">
                Lợi suất
              </h3>
              <span className="material-symbols-outlined text-green-500 text-xl">
                percent
              </span>
            </div>
            <p className="text-h4 font-bold text-slate-900 dark:text-white">
              +12.5%
            </p>
            <p className="text-smallest text-green-600 dark:text-green-400 mt-2">
              Tăng thêm 2.3%
            </p>
          </div>
        </section>

        {/* User Info Card */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
          <h2 className="text-h5 font-bold text-slate-900 dark:text-white mb-6">
            Thông tin tài khoản
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="text-smaller font-semibold text-slate-600 dark:text-slate-400 block mb-2">
                Tên đầy đủ
              </label>
              <p className="text-body font-medium text-slate-900 dark:text-white">
                {user?.fullName}
              </p>
            </div>
            <div>
              <label className="text-smaller font-semibold text-slate-600 dark:text-slate-400 block mb-2">
                Email
              </label>
              <p className="text-body font-medium text-slate-900 dark:text-white">
                {user?.email}
              </p>
            </div>
            <div>
              <label className="text-smaller font-semibold text-slate-600 dark:text-slate-400 block mb-2">
                Vai trò
              </label>
              <div className="flex items-center gap-2">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-smaller font-semibold">
                  {user?.role === "INVESTOR" ? "Nhà đầu tư" : user?.role}
                </span>
              </div>
            </div>
            <div>
              <label className="text-smaller font-semibold text-slate-600 dark:text-slate-400 block mb-2">
                Tham gia từ
              </label>
              <p className="text-body font-medium text-slate-900 dark:text-white">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                  : "N/A"}
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
