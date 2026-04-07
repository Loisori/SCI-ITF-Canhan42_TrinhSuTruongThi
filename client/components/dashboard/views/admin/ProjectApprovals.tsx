"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { formatVnd } from "@/lib/utils";
import { Project } from "@/types/project";
import toast from "react-hot-toast";

export default function ProjectApprovals() {
  const { data: pendingProjects = [], refetch, isLoading } = useQuery({
    queryKey: ["admin-pending-projects"],
    queryFn: async () => (await api.get<Project[]>("/api/admin/projects/pending")).data,
  });

  const approve = async (id: number) => {
    try {
      await api.patch(`/api/admin/projects/${id}/approve`);
      toast.success("Dự án đã được duyệt thành công.");
      refetch();
    } catch (err) {
      toast.error("Không thể duyệt dự án này.");
    }
  };

  const reject = async (id: number) => {
    try {
      await api.patch(`/api/admin/projects/${id}/reject`);
      toast.success("Đã từ chối dự án.");
      refetch();
    } catch (err) {
      toast.error("Không thể từ chối dự án này.");
    }
  };

  if (isLoading) return <div className="space-y-6 animate-pulse">
    <div className="h-10 bg-slate-100 dark:bg-slate-800 w-1/4 rounded-lg" />
    <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
  </div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-h3 font-bold text-slate-900 dark:text-white">Duyệt dự án</h1>
        <p className="text-slate-600 dark:text-slate-400 text-body mt-1">Quản lý và phê duyệt các yêu cầu huy động vốn mới.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Dự án mới chờ duyệt</h2>
          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[11px] font-bold uppercase tracking-widest">
            {pendingProjects.length} Pending
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 dark:bg-slate-800/20 text-[11px] uppercase text-slate-400 font-bold tracking-widest border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Dự án</th>
                <th className="px-6 py-4">Chủ sở hữu</th>
                <th className="px-6 py-4">Mục tiêu vốn</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pendingProjects.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-smaller font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{p.title}</p>
                    <p className="text-[10px] text-slate-500 mt-1 italic">Tạo ngày: {new Date(p.createdAt).toLocaleDateString('vi-VN')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[11px] font-bold uppercase">
                          {p.owner?.fullName?.charAt(0)}
                       </div>
                       <p className="text-smaller font-bold text-slate-700 dark:text-slate-200">{p.owner?.fullName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-smaller font-extrabold text-primary">{formatVnd(Number(p.goalAmount))}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => approve(p.id)}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-[11px] font-bold hover:shadow-lg transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        Duyệt
                      </button>
                      <button 
                         onClick={() => reject(p.id)}
                         className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-red-200 text-red-500 text-[11px] font-bold hover:bg-red-50 transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                        Từ chối
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingProjects.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 text-smaller">
                    <span className="material-symbols-outlined text-h1 text-slate-200 mb-4 scale-150">verified</span>
                    <p className="mt-4">Không có dự án nào chờ duyệt.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
