"use client";

// Services
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboard } from "@/context/DashboardContext";
import { UserProfile } from "@/types/user";

interface DashboardSidebarProps {
  user: UserProfile | null;
}

export default function DashboardSidebar({ user }: DashboardSidebarProps) {
  const { 
    isSidebarCollapsed, 
    isMobileDrawerOpen,
    setMobileDrawerOpen, 
    activeView, 
    setActiveView 
  } = useDashboard();
  const pathname = usePathname();

  const role = user?.role?.toLowerCase();
  const isAdminPath = pathname.includes("/admin-dashboard");

  const adminLinks = [
    { name: "Hệ thống", view: "system-overview", icon: "dashboard" },
    { name: "Duyệt dự án", view: "project-approvals", icon: "fact_check" },
    { name: "Người dùng", view: "user-management", icon: "group" },
  ];

  const userLinks = [
    { name: "Tổng quan", view: "overview", icon: "grid_view" },
    { name: "Ví & Giao dịch", view: "wallet", icon: "account_balance_wallet" },
    { name: "Đầu tư của tôi", view: "portfolio", icon: "insights" },
    ...(role === "owner" ? [
      { name: "Dự án của tôi", view: "my-projects", icon: "rocket_launch" },
    ] : []),
    { name: "Cài đặt", view: "settings", icon: "settings" },
  ];

  const links = isAdminPath ? adminLinks : userLinks;

  const handleLinkClick = (view: string) => {
    setActiveView(view);
    setMobileDrawerOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`${
          isSidebarCollapsed ? "w-20" : "w-64"
        } fixed left-0 top-0 h-screen z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 hidden lg:flex flex-col shadow-sm`}
      >
        <Link href="/" className="p-6 flex items-center gap-3 h-20">
          <div className="size-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-base">rocket_launch</span>
          </div>
          {!isSidebarCollapsed && (
            <span className="font-bold text-h5 text-slate-900 dark:text-white tracking-tight">InvestPro</span>
          )}
        </Link>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          <div className="space-y-1">
            {!isSidebarCollapsed && (
              <p className="px-2 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Menu
              </p>
            )}
            {links.map((link) => {
              const isActive = activeView === link.view;
              return (
                <button
                  key={link.view}
                  onClick={() => handleLinkClick(link.view)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  <span className={`material-symbols-outlined ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-primary"
                  }`}>
                    {link.icon}
                  </span>
                  {!isSidebarCollapsed && (
                    <span className="text-smaller font-bold truncate">{link.name}</span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Profile Mini */}
        {!isSidebarCollapsed && user && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800/50">
             <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-white/5">
                <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-smaller overflow-hidden shrink-0">
                   {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                   ) : (
                      user.fullName?.charAt(0).toUpperCase()
                   )}
                </div>
                <div className="min-w-0">
                   <p className="text-[12px] font-bold text-slate-900 dark:text-white truncate">{user.fullName}</p>
                   <p className="text-[10px] text-slate-500 uppercase tracking-tighter truncate">{role}</p>
                </div>
             </div>
          </div>
        )}
      </aside>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 transform lg:hidden transition-transform duration-300 ${
          isMobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 h-20 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
          <div className="size-8 rounded-xl bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-base">rocket_launch</span>
          </div>
          <span className="font-bold text-h5 text-slate-900 dark:text-white tracking-tight">InvestPro</span>
        </div>

        <nav className="px-4 py-6 space-y-2 overflow-y-auto h-[calc(100vh-80px)]">
          {links.map((link) => {
             const isActive = activeView === link.view;
             return (
               <button
                 key={link.view}
                 onClick={() => handleLinkClick(link.view)}
                 className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                   isActive
                     ? "bg-primary text-white shadow-lg shadow-primary/20"
                     : "text-slate-500 dark:text-slate-400"
                 }`}
               >
                 <span className="material-symbols-outlined">{link.icon}</span>
                 <span className="text-smaller font-bold">{link.name}</span>
               </button>
             );
           })}
        </nav>
      </div>
    </>
  );
}
