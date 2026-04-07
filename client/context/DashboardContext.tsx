"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface DashboardContextType {
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isMobileDrawerOpen: boolean;
  setMobileDrawerOpen: (open: boolean) => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  // Default view: if admin-dashboard route, it's different
  const defaultView = pathname.includes("admin-dashboard") ? "system-overview" : "overview";
  const [activeView, setActiveViewState] = useState(searchParams.get("tab") || defaultView);

  const setActiveView = (view: string) => {
    setActiveViewState(view);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", view);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Sync with URL changes (back/forward)
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && tab !== activeView) {
      setActiveViewState(tab);
    }
  }, [searchParams, activeView]);

  return (
    <DashboardContext.Provider
      value={{
        isSidebarCollapsed,
        setSidebarCollapsed,
        isMobileDrawerOpen,
        setMobileDrawerOpen,
        activeView,
        setActiveView,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
