"use client";

import { useDashboard } from "@/context/DashboardContext";
import ThemeToggle from "@/components/client/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { UserProfile } from "@/types/user";
import { PanelLeftOpen, Menu } from "lucide-react";

interface DashboardHeaderProps {
  user: UserProfile | null;
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const { setSidebarCollapsed, isSidebarCollapsed, setMobileDrawerOpen } = useDashboard();

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden lg:flex p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-500 transition-colors"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen />
          ) : (
            <Menu />
          )}
        </button>

        {/* Mobile Sidebar Toggle */}
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-500"
        >
          <Menu />
        </button>

        {/* Dynamic Title / Breadcrumb (Simple for now) */}
        <h2 className="text-small font-bold text-slate-900 dark:text-white hidden sm:block uppercase tracking-wider">
           Dashboard
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <ThemeToggle />
        
        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1"></div>

        {user && (
          <div className="flex items-center gap-3 pl-2">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[11px] font-bold text-slate-400 leading-tight uppercase tracking-widest text-right">
                {user.role}
              </span>
              <span className="text-small font-bold text-slate-900 dark:text-white">
                 {user.fullName}
              </span>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-smallest font-bold overflow-hidden border-2 border-primary/20">
               {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
               ) : (
                  user.fullName?.charAt(0).toUpperCase()
               )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
