"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { UserProfile } from "@/types/user";
import { DashboardProvider, useDashboard } from "@/context/DashboardContext";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";

interface DashboardLayoutProps {
  children: ReactNode;
  user?: UserProfile | null;
}

function DashboardContent({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser?: UserProfile | null;
}) {
  const { isSidebarCollapsed } = useDashboard();
  const {
    data: profile,
    isLoading,
    error,
    status,
  } = useQuery({
    queryKey: ["auth-profile"],
    queryFn: async () => {
      const res = await api.get<UserProfile>("/api/auth/profile");
      return res.data;
    },
    initialData: initialUser || undefined,
    retry: false,
  });

  const router = useRouter();

  useEffect(() => {
    if (!isLoading && error) {
      router.push("/login");
    }
  }, [isLoading, error, router]);

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-primary/20 rounded-full animate-spin border-t-2 border-primary"></div>
          <p className="text-smaller font-bold text-slate-500">
            Đang tải dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark font-display">
      <DashboardSidebar user={profile} />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? "lg:pl-20" : "lg:pl-100"}`}
      >
        <DashboardHeader user={profile} />

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
  user,
}: DashboardLayoutProps) {
  return (
    <DashboardProvider>
      <DashboardContent initialUser={user}>{children}</DashboardContent>
    </DashboardProvider>
  );
}
