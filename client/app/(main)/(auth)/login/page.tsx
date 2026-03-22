"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/client/Navbar";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <Navbar />
      <main className="w-full min-h-screen flex flex-col md:flex-row font-display bg-background">
        {/* Left Side: Branding and Visual (Chỉ hiện trên Desktop) */}
        <section className="hidden md:flex md:w-1/2 lg:w-3/5 bg-primary relative overflow-hidden items-center justify-center p-12">
          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-500 to-transparent blur-3xl"></div>
            <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-indigo-900 to-transparent blur-3xl"></div>
          </div>

          <div className="relative z-10 max-w-lg text-left">
            <Link href="/" className="mb-12 flex items-center gap-2 group">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
                <span
                  className="material-symbols-outlined text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  rocket_launch
                </span>
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">
                InvestPro
              </span>
            </Link>

            <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">
              Secure your financial future.
            </h1>
            <p className="text-lg text-slate-400 font-medium leading-relaxed mb-10 max-w-md">
              Truy cập công cụ đầu tư cấp độ tổ chức và thông tin chi tiết với
              độ chính xác tuyệt đối.
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
                <div className="text-2xl font-bold text-white">0.02%</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400">
                  Competitive Spreads
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400">
                  Expert Support
                </div>
              </div>
            </div>
          </div>

          {/* Background Image Overlay */}
          <div className="absolute inset-0 z-0 opacity-30 mix-blend-overlay">
            <Image
              src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1000&q=80"
              alt="Financial Grid"
              fill
              className="object-cover"
            />
          </div>
        </section>

        {/* Right Side: Login Form */}
        <section className="flex-1 bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 md:p-12 lg:p-20 relative">
          {/* Mobile Logo */}
          <div className="md:hidden absolute top-8 left-8 flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              rocket_launch
            </span>
            <span className="text-xl font-bold tracking-tight text-primary dark:text-white">
              InvestPro
            </span>
          </div>

          <div className="w-full max-w-md">
            <header className="mb-10 text-left">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Đăng nhập hệ thống
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                Nhập thông tin xác thực để quản lý danh mục đầu tư của bạn.
              </p>
            </header>

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              {/* Email Field */}
              <div className="space-y-2">
                <label
                  className="text-[10px] uppercase tracking-widest font-bold text-slate-500"
                  htmlFor="email"
                >
                  Địa chỉ Email
                </label>
                <input
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-lg border-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white transition-all"
                  id="email"
                  type="email"
                  placeholder="name@institution.com"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label
                    className="text-[10px] uppercase tracking-widest font-bold text-slate-500"
                    htmlFor="password"
                  >
                    Mật khẩu
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[10px] uppercase tracking-widest font-bold text-primary hover:underline"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative group">
                  <input
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 rounded-lg border-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white transition-all"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-small">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <button className="w-full py-4 bg-primary text-white font-bold rounded-lg shadow-sm hover:opacity-90 transition-all active:scale-[0.98]">
                Đăng nhập
              </button>
            </form>

            <footer className="mt-12 text-center">
              <p className="text-sm text-slate-500 font-medium">
                Chưa có tài khoản?
                <Link
                  className="text-primary font-bold hover:underline ml-1"
                  href="/register"
                >
                  Đăng ký ngay
                </Link>
              </p>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
