"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";
import api from "@/lib/axios";

interface User {
  id: string;
  fullName: string;
  email: string;
  balance: number;
  role: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("account");
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get<User>("/auth/profile");

        setUser(response.data);
        setLoading(false);
      } catch {
        setLoading(false);
        router.push("/login");
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

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />
      <main className="wrapper wrapper--lg py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-smaller text-slate-600 dark:text-slate-400 mb-8">
          <Link
            href="/dashboard"
            className="hover:text-primary transition-colors"
          >
            Trang chủ
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-semibold">
            Cài đặt
          </span>
        </div>

        {/* Page Header */}
        <section className="mb-12">
          <h1 className="text-h2 font-bold text-slate-900 dark:text-white mb-2">
            Cài đặt tài khoản
          </h1>
          <p className="text-body text-slate-600 dark:text-slate-400">
            Quản lý thông tin cá nhân và cài đặt tài khoản của bạn
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <nav className="space-y-2 sticky top-20">
              <button
                onClick={() => setActiveTab("account")}
                className={`w-full text-left px-4 py-2 rounded-lg text-smaller font-semibold transition-colors ${
                  activeTab === "account"
                    ? "bg-primary text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Thông tin tài khoản
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`w-full text-left px-4 py-2 rounded-lg text-smaller font-semibold transition-colors ${
                  activeTab === "password"
                    ? "bg-primary text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Đổi mật khẩu
              </button>
              <button
                onClick={() => setActiveTab("privacy")}
                className={`w-full text-left px-4 py-2 rounded-lg text-smaller font-semibold transition-colors ${
                  activeTab === "privacy"
                    ? "bg-primary text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Quyền riêng tư
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`w-full text-left px-4 py-2 rounded-lg text-smaller font-semibold transition-colors ${
                  activeTab === "notifications"
                    ? "bg-primary text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Thông báo
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <section className="lg:col-span-3">
            {/* Account Settings Tab */}
            {activeTab === "account" && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
                <h2 className="text-h5 font-bold text-slate-900 dark:text-white mb-6">
                  Thông tin tài khoản
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-smaller font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Tên đầy đủ
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.fullName}
                      disabled
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-smaller"
                    />
                  </div>

                  <div>
                    <label className="block text-smaller font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      disabled
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-smaller"
                    />
                  </div>

                  <div>
                    <label className="block text-smaller font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Vai trò
                    </label>
                    <div className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-smaller">
                      <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                        {user?.role === "INVESTOR" ? "Nhà đầu tư" : user?.role}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:shadow-lg transition-shadow text-smaller">
                      Cập nhật thông tin
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === "password" && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
                <h2 className="text-h5 font-bold text-slate-900 dark:text-white mb-6">
                  Đổi mật khẩu
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-smaller font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      placeholder="Nhập mật khẩu hiện tại"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-smaller focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-smaller font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      placeholder="Nhập mật khẩu mới"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-smaller focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-smaller font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      type="password"
                      placeholder="Xác nhận mật khẩu mới"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-smaller focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="pt-4">
                    <button className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:shadow-lg transition-shadow text-smaller">
                      Cập nhật mật khẩu
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === "privacy" && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
                <h2 className="text-h5 font-bold text-slate-900 dark:text-white mb-6">
                  Quyền riêng tư
                </h2>

                <div className="space-y-4">
                  <label className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <div>
                      <p className="text-smaller font-semibold text-slate-900 dark:text-white">
                        Cho phép hiển thị hồ sơ công khai
                      </p>
                      <p className="text-smallest text-slate-600 dark:text-slate-400">
                        Cho phép người khác xem thông tin hồ sơ của bạn
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <div>
                      <p className="text-smaller font-semibold text-slate-900 dark:text-white">
                        Cho phép liên hệ qua email
                      </p>
                      <p className="text-smallest text-slate-600 dark:text-slate-400">
                        Nhận thông báo và cập nhật qua email
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" />
                    <div>
                      <p className="text-smaller font-semibold text-slate-900 dark:text-white">
                        Chia sẻ dữ liệu phân tích
                      </p>
                      <p className="text-smallest text-slate-600 dark:text-slate-400">
                        Giúp chúng tôi cải thiện dịch vụ bằng cách chia sẻ dữ
                        liệu sử dụng
                      </p>
                    </div>
                  </label>

                  <div className="pt-4">
                    <button className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:shadow-lg transition-shadow text-smaller">
                      Lưu cài đặt
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
                <h2 className="text-h5 font-bold text-slate-900 dark:text-white mb-6">
                  Cài đặt thông báo
                </h2>

                <div className="space-y-4">
                  <label className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <div>
                      <p className="text-smaller font-semibold text-slate-900 dark:text-white">
                        Thông báo dự án mới
                      </p>
                      <p className="text-smallest text-slate-600 dark:text-slate-400">
                        Nhận thông báo khi có dự án đầu tư mới
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <div>
                      <p className="text-smaller font-semibold text-slate-900 dark:text-white">
                        Cập nhật về dự án của bạn
                      </p>
                      <p className="text-smallest text-slate-600 dark:text-slate-400">
                        Nhận cập nhật về tiến độ dự án bạn đã đầu tư
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <div>
                      <p className="text-smaller font-semibold text-slate-900 dark:text-white">
                        Thông báo giao dịch
                      </p>
                      <p className="text-smallest text-slate-600 dark:text-slate-400">
                        Nhận thông báo về giao dịch và thanh toán
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" />
                    <div>
                      <p className="text-smaller font-semibold text-slate-900 dark:text-white">
                        Thông báo tiếp thị
                      </p>
                      <p className="text-smallest text-slate-600 dark:text-slate-400">
                        Nhận thông báo về ưu đãi và chương trình khuyến mãi
                      </p>
                    </div>
                  </label>

                  <div className="pt-4">
                    <button className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:shadow-lg transition-shadow text-smaller">
                      Lưu cài đặt
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
