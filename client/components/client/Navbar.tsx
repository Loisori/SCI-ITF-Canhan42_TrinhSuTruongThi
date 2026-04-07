"use client";

//services
import { useCallback, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/lib/axios";

//types
import { NavbarUserProfile } from "@/types/navbar";
import { Notification } from "@/types/notification";

//compoenents
import ThemeToggle from "./ThemeToggle";
import HeaderSearch from "./HeaderSearch";
import HeaderCategoryNav from "./HeaderCategoryNav";
import { useNotifications } from "@/components/providers/NotificationProvider";


const AUTH_CHANGED_EVENT = "auth-changed";

export default function Navbar() {
  const [user, setUser] = useState<NavbarUserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  // Notification hook, wrapped in a try/catch or checked so it handles missing context gracefully if needed
  // However, layout already wraps with provider properly
  const { notifications, unreadCount, markAsRead, markAllAsRead } = typeof useNotifications === 'function' ? useNotifications() : { notifications: [], unreadCount: 0, markAsRead: async () => {}, markAllAsRead: async () => {} };
  
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutsideNotif = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideNotif);
    return () => document.removeEventListener("mousedown", handleClickOutsideNotif);
  }, []);

  const syncUser = useCallback(async () => {
    const token = Cookies.get("access_token");

    if (!token) {
      setUser(null);
      setIsInitializing(false);
      return;
    }

    try {
      const response = await api.get("/api/auth/profile");
      setUser(response.data as NavbarUserProfile);
    } catch (error) {
      if (
        (error as { response?: { status?: number } })?.response?.status === 403
      ) {
        Cookies.remove("access_token", { path: "/" });
        setUser(null);
      }
    } finally {
      setIsInitializing(false);
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
        <div className="flex flex-wrap items-center gap-y-3 gap-x-3 md:gap-x-4 md:flex-nowrap md:h-16 py-3 md:py-0">
          {/* Logo */}
          <Link
            href="/"
            className="inline-flex! items-center gap-2 shrink-0 order-1"
          >
            <span className="material-symbols-outlined text-primary dark:text-slate-100 text-h4">
              rocket_launch
            </span>
            <h1 className="text-h6 font-extrabold tracking-tight text-primary dark:text-slate-100">
              InvestPro
            </h1>
          </Link>

          <div
            id="search"
            className="w-full order-3 md:order-2 md:flex-1 md:min-w-0"
          >
            <HeaderSearch />
          </div>

          <div className="flex items-center gap-3 md:gap-4 shrink-0 order-2 ml-auto md:ml-0 md:order-3">
            <ThemeToggle />

            {isInitializing ? (
              /* --- SKELETON LOADER ĐỂ TRÁNH NHÁY GIAO DIỆN --- */
              <div className="flex items-center gap-4">
                <div className="hidden lg:flex flex-col items-end gap-1">
                  <div className="w-8 h-2 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                  <div className="w-16 h-3 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0"></div>
                <div className="hidden sm:block w-20 h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
              </div>
            ) : user ? (
              /* --- KHI ĐÃ ĐĂNG NHẬP --- */
              <div className="flex items-center gap-4">
                
                {/* Notification Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-center text-slate-600 dark:text-slate-300"
                  >
                    <span className="material-symbols-outlined">notifications</span>
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1.5 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white dark:border-slate-900"></span>
                      </span>
                    )}
                  </button>

                  {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-[320px] max-h-[400px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-2 z-50 overflow-hidden flex flex-col cursor-auto">
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">Thông báo</h3>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-primary text-[12px] hover:underline"
                          >
                            Đánh dấu đã đọc tất cả
                          </button>
                        )}
                      </div>
                      <div className="overflow-y-auto flex-1">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-slate-500 text-small">
                            Không có thông báo nào.
                          </div>
                        ) : (
                          notifications.map((n: Notification) => (
                            <div 
                              key={n.id} 
                              className={`px-4 py-3 border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                              onClick={() => {
                                if (!n.isRead) markAsRead(n.id);
                              }}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className={`text-[13px] leading-snug ${!n.isRead ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                                  {n.message}
                                </span>
                                {!n.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5 ml-2"></span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {new Date(n.createdAt).toLocaleDateString('vi-VN')} {new Date(n.createdAt).toLocaleTimeString('vi-VN')}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

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
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover border border-primary/20"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-smallest font-bold shrink-0">
                        {user.fullName?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="hidden sm:block text-small font-bold text-slate-700 dark:text-slate-200">
                      {user.fullName}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 min-w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-2 z-50">
                      {/* Dashboard Link */}
                      <Link
                        href={user.role?.toLowerCase() === "admin" ? "/admin-dashboard" : "/dashboard"}
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
        <HeaderCategoryNav />
      </div>
    </header>
  );
}
