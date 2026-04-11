"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { formatVnd } from "@/lib/utils";
import { AdminOverview } from "@/types/admin";
import { Users, Clock, History, TrendingUp, BarChart3 } from "lucide-react";

function StatCard({ title, value, subtext, icon, color = "primary" }: any) {
  const colorClasses: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-smaller font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-h4 font-extrabold text-slate-900 dark:text-white">{value}</h3>
          {subtext && <p className="text-[11px] text-slate-400 mt-2 font-medium">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <icon.icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

export default function SystemOverview() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => (await api.get<AdminOverview>("/api/admin/dashboard/overview")).data,
  });

  if (isLoading) return <div className="animate-pulse space-y-6">
    <div className="h-10 bg-slate-100 dark:bg-slate-800 w-1/3 rounded-lg" />
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl" />)}
    </div>
  </div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-h3 font-bold text-slate-900 dark:text-white">Hệ thống</h1>
        <p className="text-slate-600 dark:text-slate-400 text-body mt-1">Tổng quan về người dùng, dự án và doanh thu toàn sàn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Tổng người dùng" 
          value={overview?.totalUsers ?? 0} 
          icon={{ icon: Users }} 
          color="primary"
          subtext="Hoạt động trên toàn sàn"
        />
        <StatCard 
          title="Dự án chờ duyệt" 
          value={overview?.pendingCount ?? 0} 
          icon={{ icon: Clock }} 
          color="amber"
          subtext="Cần xử lý ngay"
        />
        <StatCard 
          title="Tổng giao dịch" 
          value={overview?.totalTransactions ?? 0} 
          icon={{ icon: History }} 
          color="primary"
          subtext="Nạp/Rút & Đầu tư"
        />
        <StatCard 
          title="Doanh thu HT" 
          value={formatVnd(overview?.systemRevenue ?? 0)} 
          icon={{ icon: TrendingUp }} 
          color="emerald"
          subtext="Phí giao dịch tích lũy"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Dự án theo trạng thái</h3>
            <div className="space-y-4">
               <div>
                  <div className="flex justify-between text-[11px] font-bold uppercase mb-2">
                     <span className="text-slate-500">Đang huy động</span>
                     <span className="text-primary">{overview?.fundingCount} dự án</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                     <div className="bg-primary h-full" style={{ width: `${(overview?.fundingCount || 0) / (overview?.totalProjects || 1) * 100}%` }}></div>
                  </div>
               </div>
               <div>
                  <div className="flex justify-between text-[11px] font-bold uppercase mb-2">
                     <span className="text-slate-500">Đã hoàn thành</span>
                     <span className="text-emerald-500">{overview?.completedCount} dự án</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                     <div className="bg-emerald-500 h-full" style={{ width: `${(overview?.completedCount || 0) / (overview?.totalProjects || 1) * 100}%` }}></div>
                  </div>
               </div>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col items-center justify-center text-center">
            <BarChart3 className="text-h1 text-slate-100 mb-4 scale-150 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Báo cáo chi tiết</h3>
            <p className="text-smaller text-slate-500 mt-2">Dữ liệu phân tích nâng cao sẽ sớm được tích hợp.</p>
         </div>
      </div>
    </div>
  );
}
