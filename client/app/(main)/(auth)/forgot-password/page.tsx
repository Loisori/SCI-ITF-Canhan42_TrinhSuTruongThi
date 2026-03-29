"use client";

import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col font-display antialiased bg-[#f6f7f8] dark:bg-[#0a172e] transition-colors duration-300">
      {/* Background Texture (Tạo hiệu ứng chấm nhỏ như template) */}
      <div
        className="fixed inset-0 pointer-events-none opacity-50 dark:opacity-20"
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 0.5px, transparent 0.5px)",
          backgroundSize: "24px 24px",
        }}
      ></div>

      {/* Header đơn giản cho trang Auth */}
      <header className="w-full fixed top-0 z-50 bg-white/80 dark:bg-[#0a172e]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-primary dark:text-white"
          >
            InvestPro
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="#"
              className="text-smaller font-medium text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white"
            >
              Support
            </Link>
            <Link
              href="#"
              className="text-smaller font-medium text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white"
            >
              Security
            </Link>
          </nav>
          <Link
            href="/login"
            className="bg-primary dark:bg-white dark:text-primary text-white px-5 py-2 rounded-lg font-semibold text-small hover:opacity-90 transition-all"
          >
            Log In
          </Link>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-4 py-24 relative z-10">
        <div className="w-full max-w-[440px]">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden p-8 md:p-10 border border-slate-100 dark:border-white/5">
            <div className="flex flex-col items-center mb-10 text-center">
              <div className="w-14 h-14 bg-primary/5 dark:bg-white/5 flex items-center justify-center rounded-2xl mb-6 border border-primary/10 dark:border-white/10">
                <span className="material-symbols-outlined text-primary dark:text-white text-3xl">
                  lock_reset
                </span>
              </div>
              <h1 className="text-h4 font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                Đặt lại mật khẩu
              </h1>
              <p className="text-smaller text-slate-500 dark:text-slate-400 leading-relaxed max-w-[320px]">
                Nhập email của bạn và chúng tôi sẽ gửi một liên kết để khôi phục
                quyền truy cập tài khoản.
              </p>
            </div>

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <label
                  className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400 ml-1"
                  htmlFor="email"
                >
                  Địa chỉ Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-body">
                      mail
                    </span>
                  </div>
                  <input
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white text-small ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-primary transition-all placeholder:text-slate-400"
                    id="email"
                    type="email"
                    placeholder="name@institutional.com"
                    required
                  />
                </div>
              </div>

              <button
                className="w-full bg-primary dark:bg-white dark:text-primary text-white py-4 rounded-xl font-bold text-small tracking-wide shadow-lg hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                type="submit"
              >
                Gửi liên kết đặt lại
                <span className="material-symbols-outlined text-body">
                  arrow_forward
                </span>
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-small font-bold text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors group"
              >
                <span className="material-symbols-outlined text-body group-hover:-translate-x-1 transition-transform">
                  arrow_back
                </span>
                Quay lại Đăng nhập
              </Link>
            </div>
          </div>

          {/* Secure Badge */}
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-full border border-slate-200 dark:border-white/10 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Mã hóa đầu cuối an toàn
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
