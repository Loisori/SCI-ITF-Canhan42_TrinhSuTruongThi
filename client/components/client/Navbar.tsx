"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import axios from "axios";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // 1. Lấy thông tin user khi component load
  useEffect(() => {
    const fetchProfile = async () => {
      const token = Cookies.get("access_token");
      if (token) {
        try {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(response.data);
        } catch (err) {
          // Nếu token hết hạn hoặc lỗi, xóa cookie
          Cookies.remove("access_token");
          setUser(null);
        }
      }
    };
    fetchProfile();
  }, []);

  // 2. Hàm đăng xuất
  const handleLogout = () => {
    Cookies.remove("access_token");
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10 dark:border-white/10 font-display">
      <div className="wrapper wrapper--lg">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary dark:text-slate-100 text-h4">
              rocket_launch
            </span>
            <h1 className="text-h6 font-extrabold tracking-tight text-primary dark:text-slate-100">
              InvestPro
            </h1>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/dashboard" className="text-smaller font-semibold hover:text-primary/70 dark:hover:text-slate-300 transition-colors">
              Dashboard
            </Link>
            <Link href="/projects" className="text-smaller font-semibold hover:text-primary/70 dark:hover:text-slate-300 transition-colors">
              Dự án
            </Link>
            <Link href="/procedure" className="text-smaller font-semibold hover:text-primary/70 dark:hover:text-slate-300 transition-colors">
              Quy trình
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            {user ? (
              /* --- KHI ĐÃ ĐĂNG NHẬP --- */
              <div className="flex items-center gap-4">
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Số dư</span>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    ${Number(user.balance).toLocaleString()}
                  </span>
                </div>
                
                <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                    {user.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-smaller font-bold text-slate-700 dark:text-slate-200">
                    {user.fullName}
                  </span>
                  <button onClick={handleLogout} className="ml-2 text-slate-400 hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined text-lg">logout</span>
                  </button>
                </div>
              </div>
            ) : (
              /* --- KHI CHƯA ĐĂNG NHẬP --- */
              <div className="flex items-center gap-3">
                <Link href="/login" className="hidden sm:block px-4 py-2 text-smaller font-bold text-primary dark:text-slate-100 hover:bg-primary/5 dark:hover:bg-white/5 rounded-lg transition-colors">
                  Đăng nhập
                </Link>
                <Link href="/register" className="px-5 py-2 text-smaller font-bold bg-primary dark:bg-slate-100 dark:text-primary text-white rounded-lg hover:shadow-lg transition-all">
                  Bắt đầu ngay
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}