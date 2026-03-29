"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("investor");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const router = useRouter();

  // Handle form submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Send registration data to backend
      const response = await api.post("/auth/register", {
        email: email.toLowerCase(),
        password,
        fullName,
        role,
      });

      if (response.data) {
        setSuccess(true);
        // Redirect to login page after successful registration
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err: any) {
      // Handle different error types
      const message =
        err.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      setError(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-grow flex flex-col md:flex-row min-h-screen font-display bg-background">
      {/* Visual Section (Split Screen Left) */}
      <section className="hidden md:flex md:w-1/2 bg-primary relative overflow-hidden items-center justify-center p-12">
        {/* Decorative Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, #ffffff 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        ></div>

        <div className="relative z-10 max-w-lg">
          <div className="mb-8">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[10px] uppercase tracking-widest font-bold">
              Institutional Grade
            </span>
          </div>
          <h1 className="text-h3 md:text-h2 font-extrabold text-white leading-tight mb-6">
            The Sovereign Architect of Your Wealth.
          </h1>
          <p className="text-body text-slate-300 mb-10 leading-relaxed font-light">
            Tham gia cộng đồng các nhà đầu tư ưu tú, sử dụng các công cụ được
            thiết kế chính xác để mang lại sự minh bạch tài chính.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-2xl font-bold text-white mb-1">256-bit</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                Encryption
              </div>
            </div>
            <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-2xl font-bold text-white mb-1">SEC</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                Compliant
              </div>
            </div>
          </div>
        </div>

        {/* Abstract Background Visuals */}
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]"></div>
      </section>

      {/* Form Section (Split Screen Right) */}
      <section className="flex-grow md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-white dark:bg-slate-950">
        <div className="w-full max-w-md">
          {/* Mobile Logo Only */}
          <div className="md:hidden flex items-center gap-2 mb-10">
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

          <div className="mb-10 text-center md:text-left">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Tạo tài khoản mới
            </h2>
            <p className="text-slate-500 text-small">
              Bắt đầu hành trình đầu tư thông minh cùng InvestPro ngay hôm nay.
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-small">
              Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-small">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleRegister}>
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">
                Họ và tên
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-body group-focus-within:text-primary transition-colors">
                  person
                </span>
                <input
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-primary transition-all text-small outline-none placeholder:text-slate-400"
                  placeholder="Nhập họ và tên của bạn"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">
                Email của bạn
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-body group-focus-within:text-primary transition-colors">
                  mail
                </span>
                <input
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-primary transition-all text-small outline-none placeholder:text-slate-400"
                  placeholder="name@company.com"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">
                Mật khẩu
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-body group-focus-within:text-primary transition-colors">
                  lock
                </span>
                <input
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-primary transition-all text-small outline-none placeholder:text-slate-400"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              {/* Strength Indicator */}
              <div className="mt-2 px-1 flex items-center justify-between">
                <div className="flex gap-1 flex-1 max-w-[120px]">
                  <div className="h-1 w-full bg-green-500 rounded-full"></div>
                  <div className="h-1 w-full bg-green-500 rounded-full"></div>
                  <div className="h-1 w-full bg-green-500 rounded-full"></div>
                  <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                </div>
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider ml-3">
                  Mạnh
                </span>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">
                Vai trò của bạn
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    id="investor"
                    name="role"
                    type="radio"
                    value="investor"
                    checked={role === "investor"}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-4 h-4 text-primary border-slate-300 focus:ring-primary"
                  />
                  <label
                    htmlFor="investor"
                    className="text-small text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <span className="font-semibold">Nhà đầu tư</span> - Tôi muốn
                    đầu tư vào các dự án
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="owner"
                    name="role"
                    type="radio"
                    value="owner"
                    checked={role === "owner"}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-4 h-4 text-primary border-slate-300 focus:ring-primary"
                  />
                  <label
                    htmlFor="owner"
                    className="text-small text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <span className="font-semibold">Chủ dự án</span> - Tôi muốn
                    huy động vốn cho dự án của mình
                  </label>
                </div>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 pt-2">
              <input
                className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary bg-white transition-all"
                id="terms"
                type="checkbox"
                required
              />
              <label
                className="text-smallest text-slate-500 leading-relaxed"
                htmlFor="terms"
              >
                Tôi đồng ý với các{" "}
                <Link
                  className="text-primary font-semibold hover:underline"
                  href="#"
                >
                  Điều khoản dịch vụ
                </Link>{" "}
                và{" "}
                <Link
                  className="text-primary font-semibold hover:underline"
                  href="#"
                >
                  Chính sách bảo mật
                </Link>{" "}
                của InvestPro.
              </label>
            </div>

            {/* Submit Button */}
            <button
              className={`w-full bg-primary text-white font-bold py-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 group ${
                isLoading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"
              }`}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang tạo tài khoản...
                </>
              ) : (
                <>
                  Tạo tài khoản
                  <span className="material-symbols-outlined text-body group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-small text-slate-500">
              Đã có tài khoản?{" "}
              <Link
                className="text-primary font-bold hover:underline"
                href="/login"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
