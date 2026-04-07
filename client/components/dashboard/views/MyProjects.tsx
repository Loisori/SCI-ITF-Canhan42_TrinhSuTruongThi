"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { formatVnd } from "@/lib/utils";
import { UserProfile } from "@/types/user";
import { OwnerProject } from "@/types/dashboard";
import Link from "next/link";
import toast from "react-hot-toast";

export default function MyProjects({ profile }: { profile: UserProfile }) {
  const [activeProject, setActiveProject] = useState<number | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: projects = [], refetch } = useQuery({
    queryKey: ["owner-projects-all"],
    queryFn: async () => (await api.get<{ items: OwnerProject[] }>("/api/projects/owner?pageSize=50")).data.items,
  });

  const handleStopFunding = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn dừng huy động vốn sớm cho dự án này?")) return;
    try {
      await api.put(`/api/projects/${id}/stop-funding`);
      toast.success("Dự án đã dừng huy động vốn thành công.");
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể dừng huy động vốn.");
    }
  };

  const handleSubmitProof = async (projectId: number, milestoneId: number) => {
    if (!proofUrl) {
      toast.error("Vui lòng nhập link minh chứng (URL)");
      return;
    }
    try {
      setIsSubmitting(true);
      await api.patch(`/api/projects/${projectId}/milestones/${milestoneId}/proof`, { proofUrl });
      toast.success("Đã gửi minh chứng thành công. Chờ Admin phê duyệt.");
      setProofUrl("");
      setActiveProject(null);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể gửi minh chứng");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-h3 font-bold text-slate-900 dark:text-white">Dự án của tôi</h1>
          <p className="text-slate-600 dark:text-slate-400 text-body mt-1">Quản lý và cập nhật tiến độ các dự án của bạn.</p>
        </div>
        <Link href="/projects/create" className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center gap-2">
           <span className="material-symbols-outlined">add</span>
           Tạo dự án mới
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {projects.map((p) => (
          <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row justify-between gap-6">
               <div className="flex gap-5 min-w-0">
                  {p.thumbnailUrl ? (
                    <img src={p.thumbnailUrl} alt="" className="w-40 h-28 rounded-2xl object-cover shrink-0" />
                  ) : (
                    <div className="w-40 h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                       <span className="material-symbols-outlined text-slate-300 text-h2">image</span>
                    </div>
                  )}
                  <div className="min-w-0">
                     <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        p.status === 'funding' ? 'bg-amber-500/10 text-amber-600' : 
                        p.status === 'completed' ? 'bg-green-500/10 text-green-600' : 
                        'bg-slate-500/10 text-slate-600'
                     }`}>
                        {p.status}
                     </span>
                     <h3 className="text-h5 font-bold text-slate-900 dark:text-white mt-1 truncate">{p.title}</h3>
                     <p className="text-smaller text-slate-500 mt-2 line-clamp-2">{p.shortDescription}</p>
                     
                     <div className="mt-4 flex items-center gap-6">
                        <div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiến độ vốn</p>
                           <p className="text-smaller font-bold text-primary mt-1">{p.fundingProgress}% ({formatVnd(Number(p.currentAmount))})</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nhà đầu tư</p>
                           <p className="text-smaller font-bold text-slate-900 dark:text-white mt-1">{p.investorsCount} Investor</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col gap-2 shrink-0 md:min-w-40">
                  <button 
                     onClick={() => handleStopFunding(p.id)}
                     disabled={p.status !== 'funding'}
                     className="w-full py-2.5 rounded-xl border border-red-200 text-red-500 font-bold text-smaller hover:bg-red-50 transition-all disabled:opacity-30"
                  >
                     Dừng huy động
                  </button>
                  <Link 
                     href={`/dashboard/my-projects/${p.id}/edit`}
                     className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 dark:text-slate-200 font-bold text-smaller text-center hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                  >
                     Chỉnh sửa
                  </Link>
                  <button 
                     onClick={() => setActiveProject(activeProject === p.id ? null : p.id)}
                     className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-smaller transition-all"
                  >
                     {activeProject === p.id ? "Đóng chi tiết" : "Cập nhật giai đoạn"}
                  </button>
               </div>
            </div>

            {activeProject === p.id && (
               <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 animate-in slide-in-from-top-4 duration-300">
                  <h4 className="text-smaller font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-6">Các giai đoạn giải ngân (Milestones)</h4>
                  <div className="space-y-4">
                     {p.milestones && p.milestones.length > 0 ? p.milestones.map((m: any, idx: number) => (
                        <div key={idx} className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900">
                           <div className="flex gap-4">
                              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{idx + 1}</div>
                              <div>
                                 <p className="text-smaller font-bold text-slate-900 dark:text-white">{m.title}</p>
                                 <p className="text-[12px] text-slate-500 mt-1">{m.description}</p>
                                 <p className="text-[11px] font-bold text-primary mt-2">Dự kiến vốn: {formatVnd(Number(m.fundingAmount))}</p>
                                 {m.proofUrl && (
                                    <div className="mt-3 flex items-center gap-2 text-green-600">
                                       <span className="material-symbols-outlined text-[16px]">task_alt</span>
                                       <a href={m.proofUrl} target="_blank" className="text-[11px] hover:underline font-bold">Xem minh chứng đã nộp</a>
                                    </div>
                                 )}
                              </div>
                           </div>
                           
                           {m.status === 'pending' || !m.status || m.status === 'waiting' && (
                              <div className="flex flex-col items-end gap-3">
                                 <input 
                                    type="text" 
                                    placeholder="Dán URL minh chứng..." 
                                    disabled={m.status === 'active' || !!m.proofUrl}
                                    onChange={(e) => setProofUrl(e.target.value)}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-[11px] outline-none min-w-48 placeholder:italic"
                                 />
                                 <button 
                                    disabled={isSubmitting || !!m.proofUrl}
                                    onClick={() => handleSubmitProof(p.id, m.id)}
                                    className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold rounded-lg hover:shadow-md transition disabled:opacity-30"
                                 >
                                    Nộp minh chứng
                                 </button>
                              </div>
                           )}
                        </div>
                     )) : (
                        <p className="text-smaller text-slate-500 italic">Dự án chưa cấu hình giai đoạn giải ngân.</p>
                     )}
                  </div>
               </div>
            )}
          </div>
        ))}

        {projects.length === 0 && (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
             <span className="material-symbols-outlined text-[60px] text-slate-200 mb-4">rocket_launch</span>
             <p className="text-smaller text-slate-500">Bạn chưa có dự án nào.</p>
             <Link href="/projects/create" className="text-primary font-bold mt-4 inline-block hover:underline">Khởi tạo dự án đầu tiên</Link>
          </div>
        )}
      </div>
    </div>
  );
}
