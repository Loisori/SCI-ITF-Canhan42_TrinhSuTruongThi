"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { formatVnd } from "@/lib/utils";
import toast from "react-hot-toast";
import { useState } from "react";
import { CameraOff, X, ShieldCheck, Banknote } from "lucide-react";

export default function Disbursements() {
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: pendingMilestones = [], refetch, isLoading } = useQuery({
    queryKey: ["admin-pending-milestones"],
    queryFn: async () => (await api.get<any[]>("/api/admin/projects/milestones/pending")).data,
  });

  const approveMilestone = async (projectId: number, milestoneId: number) => {
    if (!confirm("Bạn có chắc chắn muốn duyệt giai đoạn này và giải ngân tiền cho chủ dự án?")) return;
    try {
      await api.post(`/api/admin/projects/${projectId}/milestones/${milestoneId}/finalize`);
      toast.success("Giải ngân thành công!");
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể thực hiện giải ngân.");
    }
  };

  const handleReject = async (projectId: number, milestoneId: number) => {
    if (!rejectionReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }
    try {
      await api.patch(`/api/admin/projects/${projectId}/milestones/${milestoneId}/reject`, {
        reason: rejectionReason
      });
      toast.success("Đã gửi yêu cầu bổ sung bằng chứng.");
      setRejectingId(null);
      setRejectionReason("");
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi từ chối.");
    }
  };

  if (isLoading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-slate-100 dark:bg-slate-800 w-1/4 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
         <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-h3 font-bold text-slate-900 dark:text-white">Duyệt Giải Ngân (Milestones)</h1>
        <p className="text-slate-600 dark:text-slate-400 text-body mt-1">
          Kiểm tra bằng chứng và phê duyệt giải ngân vốn cho các dự án theo từng giai đoạn.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {pendingMilestones.map((m: any) => (
          <div key={m.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col md:flex-row">
            {/* Image Preview Area */}
            <div className="md:w-1/3 bg-slate-100 dark:bg-slate-800 relative group aspect-video md:aspect-auto min-h-[200px]">
               {m.proofUrl ? (
                 <>
                   <img 
                     src={m.proofUrl} 
                     alt="Milestone Proof" 
                     className="w-full h-full object-cover"
                   />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <a 
                        href={m.proofUrl} 
                        target="_blank" 
                        className="bg-white text-slate-900 px-4 py-2 rounded-xl font-bold text-smaller shadow-xl"
                      >
                        Xem ảnh gốc
                      </a>
                   </div>
                 </>
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                    <CameraOff className="text-h1" />
                    <p className="text-smaller font-bold mt-2">Không có hình ảnh bằng chứng</p>
                 </div>
               )}
            </div>

            {/* Info Area */}
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                       {m.project?.title}
                    </p>
                    <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                      Giai đoạn {m.stage}: {m.title} ({m.percentage}%)
                    </h3>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Số đợt</p>
                     <p className="text-smaller font-bold text-slate-900 dark:text-white">{m.stage}/...</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                   <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold uppercase shrink-0">
                         {m.project?.owner?.fullName?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                         <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                           {m.project?.owner?.fullName}
                         </p>
                         <p className="text-[10px] text-slate-500 truncate">{m.project?.owner?.email}</p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="mt-8">
                {rejectingId === m.id ? (
                  <div className="animate-in slide-in-from-top-2">
                    <textarea 
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Nhập lý do từ chối (Vd: Ảnh mờ, thiếu tài liệu kèm theo...)"
                      className="w-full p-4 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50/10 text-smaller outline-none"
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <button 
                        onClick={() => setRejectingId(null)}
                        className="px-4 py-2 rounded-xl text-smaller font-bold text-slate-500 hover:bg-slate-50 transition"
                      >
                        Hủy
                      </button>
                      <button 
                        onClick={() => handleReject(m.projectId, m.id)}
                        className="px-6 py-2 rounded-xl bg-red-600 text-white text-smaller font-bold hover:shadow-lg transition-all"
                      >
                        Gửi từ chối
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setRejectingId(m.id)}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-red-200 text-red-500 font-bold text-smaller hover:bg-red-50 transition-all"
                    >
                       <X className="text-base" />
                      Từ chối
                    </button>
                    <button 
                      onClick={() => approveMilestone(m.projectId, m.id)}
                      className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-smaller hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                    >
                       <ShieldCheck className="text-base" />
                      Phê duyệt & Giải ngân
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {pendingMilestones.length === 0 && (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
             <Banknote className="text-[60px] text-slate-200 mb-4 mx-auto" />
             <p className="text-smaller text-slate-500">Hiện tại không có yêu cầu giải ngân nào cần xử lý.</p>
          </div>
        )}
      </div>
    </div>
  );
}
