"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Navbar from "@/components/client/Navbar";
import api from "@/lib/axios";
import { Rocket, Eye, EyeOff } from "lucide-react";

import { decodeJwt } from "jose";

const AUTH_CHANGED_EVENT = "auth-changed";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  // 1. Thêm State để quản lý Form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  // 2. Hàm xử lý đăng nhập
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Gọi API đến NestJS (đảm bảo NestJS đang chạy ở port 3001 và đã bật CORS)
      const response = await api.post("/api/auth/login", {
        email,
        password,
      });

      if (response.data.access_token) {
        // Lưu token vào Cookie (hết hạn sau 1 ngày)
        Cookies.set("access_token", response.data.access_token, {
          expires: 1,
          path: "/",
        });
        window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));

        // Giải mã token để lấy role và chuyển hướng phù hợp
        try {
          const payload = decodeJwt(response.data.access_token) as { role?: string };
          const role = payload.role?.toLowerCase();
          
          if (role === 'admin') {
            router.push("/admin-dashboard");
          } else {
            router.push("/dashboard");
          }
        } catch (e) {
          router.push("/dashboard");
        }
        
        router.refresh(); // Làm mới dữ liệu route
      }
    } catch (err: any) {
      // Xử lý lỗi từ NestJS trả về
      const message =
        err.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.";
      setError(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <main className="w-full min-h-screen flex flex-col md:flex-row font-display bg-background">
        {/* Left Side: Branding (Giữ nguyên phần UI của bạn) */}
        <section className="hidden md:flex md:w-1/2 lg:w-3/5 bg-primary relative overflow-hidden items-center justify-center p-12">
          {/* ... Nội dung cũ ... */}
          <div className="relative z-10 max-w-lg text-left">
            <Link href="/" className="mb-12 flex items-center gap-2 group">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
                <Rocket className="text-primary" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">
                InvestPro
              </span>
            </Link>
            <h1 className="text-h3 lg:text-h2 font-extrabold text-white tracking-tight leading-tight mb-6">
              Secure your financial future.
            </h1>
            <p className="text-body text-slate-400 font-medium leading-relaxed mb-10 max-w-md">
              Truy cập công cụ đầu tư cấp độ tổ chức và thông tin chi tiết với
              độ chính xác tuyệt đối.
            </p>
          </div>
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
          <div className="w-full max-w-md">
            <header className="mb-10 text-left">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Đăng nhập hệ thống
              </h2>
              <p className="text-small text-slate-500 font-medium">
                Nhập thông tin xác thực để quản lý danh mục đầu tư.
              </p>
            </header>

            {/* Hiển thị lỗi nếu có */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-small">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleLogin}>
              {/* Email Field */}
              <div className="space-y-2">
                <label
                  className="text-[10px] uppercase tracking-widest font-bold text-slate-500"
                  htmlFor="email"
                >
                  Địa chỉ Email
                </label>
                <input
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-lg border-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white transition-all outline-none"
                  id="email"
                  type="email"
                  required
                  placeholder="name@institution.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 rounded-lg border-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white transition-all outline-none"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary"
                  >
                    {showPassword ? (
                      <EyeOff className="text-small" />
                    ) : (
                      <Eye className="text-small" />
                    )}
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 bg-primary text-white font-bold rounded-lg shadow-sm transition-all active:scale-[0.98] flex justify-center items-center ${isLoading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"}`}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Đăng nhập"
                )}
              </button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-100 dark:border-slate-800"></span>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest bg-white dark:bg-slate-950 px-4 text-slate-400">
                  Hoặc đăng nhập với
                </div>
              </div>

              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`}
                className="w-full py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-lg transition-all flex justify-center items-center gap-3 hover:bg-slate-50 dark:hover:bg-white/5 active:scale-[0.98]"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="w-5 h-5"
                />
                Tiếp tục với Google
              </a>
            </form>

            <footer className="mt-12 text-center">
              <p className="text-small text-slate-500 font-medium">
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
