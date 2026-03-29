"use client";
import { useCallback, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/lib/axios";
import ThemeToggle from "./ThemeToggle";

const AUTH_CHANGED_EVENT = "auth-changed";

type UserProfile = {
  fullName?: string;
  balance?: number | string;
  role?: string;
};

export default function Navbar() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const syncUser = useCallback(async () => {
    const token = Cookies.get("access_token");

    if (!token) {
      setUser(null);
      return;
    }

    try {
      const response = await api.get("/auth/profile");
      setUser(response.data as UserProfile);
    } catch (error) {
      if (
        (error as { response?: { status?: number } })?.response?.status === 403
      ) {
        Cookies.remove("access_token", { path: "/" });
        setUser(null);
      }
    }
  }, []);

  // Lắng nghe khi login/logout phát sự kiện auth-changed
  useEffect(() => {
    const handleAuthChanged = () => {
      void syncUser();
    };

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    };
  }, [syncUser]);

  // Đồng bộ user khi route thay đổi
  useEffect(() => {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }, [pathname]);

  // 2. Hàm đăng xuất
  const handleLogout = () => {
    Cookies.remove("access_token", { path: "/" });
    setUser(null);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    router.push("/");
    router.refresh();
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

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
            <Link
              href="/"
              className="text-smaller font-semibold hover:text-primary/70 dark:hover:text-slate-300 transition-colors"
            >
              Trang chủ
            </Link>
            <Link
              href="/projects"
              className="text-smaller font-semibold hover:text-primary/70 dark:hover:text-slate-300 transition-colors"
            >
              Dự án
            </Link>
            <Link
              href="/procedure"
              className="text-smaller font-semibold hover:text-primary/70 dark:hover:text-slate-300 transition-colors"
            >
              Quy trình
            </Link>
            <Link
              href="/aboutus"
              className="text-smaller font-semibold hover:text-primary/70 dark:hover:text-slate-300 transition-colors"
            >
              Về chúng tôi
            </Link>
            <Link
              href="/contact"
              className="text-smaller font-semibold hover:text-primary/70 dark:hover:text-slate-300 transition-colors"
            >
              Liên hệ
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            {user ? (
              /* --- KHI ĐÃ ĐĂNG NHẬP --- */
              <div className="flex items-center gap-4">
                {/* Balance Display (Always Visible) */}
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
                    Số dư
                  </span>
                  <span className="text-small font-bold text-green-600 dark:text-green-400">
                    ${Number(user.balance).toLocaleString()}
                  </span>
                </div>

                <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

                {/* Profile Dropdown Container */}
                <div className="relative" ref={menuRef}>
                  {/* Trigger: Profile Info */}
                  <button
                    onClick={toggleMenu}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-smallest font-bold shrink-0">
                      {user.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-small font-bold text-slate-700 dark:text-slate-200">
                      {user.fullName}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w- bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-2 z-50">
                      {/* Dashboard Link */}
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-2 text-small text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="material-symbols-outlined text-body">
                          dashboard
                        </span>
                        Dashboard
                      </Link>

                      {/* Settings Link */}
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2 text-small text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="material-symbols-outlined text-body">
                          settings
                        </span>
                        Cài đặt
                      </Link>

                      <Link
                        href="/transactions"
                        className="flex items-center gap-3 px-4 py-2 text-small text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="material-symbols-outlined text-body">
                          receipt_long
                        </span>
                        Giao dịch
                      </Link>

                      <div className="my-1 border-t border-slate-100 dark:border-slate-800"></div>

                      {/* Logout Button */}
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-small text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                      >
                        <span className="material-symbols-outlined text-body">
                          logout
                        </span>
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* --- KHI CHƯA ĐĂNG NHẬP --- */
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="hidden sm:block px-4 py-2 text-smaller font-bold text-primary dark:text-slate-100 hover:bg-primary/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 text-smaller font-bold bg-primary dark:bg-slate-100 dark:text-primary text-white rounded-lg hover:shadow-lg transition-all"
                >
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
