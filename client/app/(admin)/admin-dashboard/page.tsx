"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardContent from "@/components/dashboard/DashboardContent";
import { UserProfile } from "@/types/user";

import { Suspense } from "react";

export default function AdminDashboardPage() {
  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => (await api.get<UserProfile>("/api/auth/profile")).data,
  });

  if (isLoading) {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="size-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <DashboardLayout user={null}>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="size-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </DashboardLayout>
      </Suspense>
    );
  }

  if (!profile || profile.role !== "admin") return null;

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="size-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DashboardLayout user={profile}>
        <DashboardContent profile={profile} onUpdate={refetch} />
      </DashboardLayout>
    </Suspense>
  );
}
