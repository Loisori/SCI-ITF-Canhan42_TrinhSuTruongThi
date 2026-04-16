"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";
import api from "@/lib/axios";
import { Profile } from "@/types/user";
import { ProjectDetail } from "@/types/project";
import { ToastState } from "@/types/ui";
import MediaLibraryModal from "@/components/client/MediaLibraryModal";
import { formatVnd } from "@/lib/utils";
import { CircleAlert, Images, CircleCheck } from "lucide-react";

export default function MyProjectMilestonesPage() {
   const params = useParams<{ id: string }>();
   const router = useRouter();

   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [project, setProject] = useState<ProjectDetail | null>(null);

   const [milestones, setMilestones] = useState<{ title: string, percentage: number, stage: number }[]>([]);
   const [toast, setToast] = useState<ToastState>(null);

   const [isLibraryOpen, setIsLibraryOpen] = useState(false);
   const [activeUploadMilestoneId, setActiveUploadMilestoneId] = useState<number | null>(null);

   useEffect(() => {
      const init = async () => {
         try {
            const profileRes = await api.get<Profile>("/api/auth/profile");
            if (profileRes.data.role !== "owner") {
               router.replace("/");
               return;
            }

            const projectRes = await api.get<ProjectDetail>(`/api/projects/${params.id}`);
            setProject(projectRes.data);

            if (projectRes.data.milestones && projectRes.data.milestones.length > 0) {
               setMilestones(projectRes.data.milestones);
            } else {
               // Initialize default blocks if empty
               setMilestones([{ title: "Chi phí nguyên vật liệu mở đầu", percentage: 30, stage: 1 }]);
            }
         } catch (err) {
            setToast({ type: "error", message: "Không thể tải dữ liệu dự án." });
         } finally {
            setLoading(false);
         }
      };
      void init();
   }, [params.id, router]);

   useEffect(() => {
      if (!toast) return;
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
   }, [toast]);

   const handleSaveMilestones = async () => {
      if (!project) return;
      const total = milestones.reduce((sum, m) => sum + Number(m.percentage), 0);
      if (total !== 100) {
         setToast({ type: 'error', message: `Tổng tỷ lệ bắt buộc phải bằng 100%. Hiện đang là ${total}%` });
         return;
      }

      setSaving(true);
      try {
         await api.put(`/api/projects/${project.id}/milestones`, milestones.map((m, i) => ({
            title: m.title,
            percentage: Number(m.percentage),
            stage: i + 1
         })));
         setToast({ type: 'success', message: 'Cấu hình Milestones thành công!' });
         const updated = await api.get<ProjectDetail>(`/api/projects/${project.id}`);
         setProject(updated.data);
         if (updated.data.milestones) setMilestones(updated.data.milestones);
      } catch (err: any) {
         setToast({ type: 'error', message: err.response?.data?.message || 'Lưu cấu hình thất bại.' });
      } finally {
         setSaving(false);
      }
   };

   const handleStartVoting = async (milestoneId: number) => {
      if (!project) return; // Guard for TypeScript
      try {
         setSaving(true);
         await api.post(`/api/projects/milestones/${milestoneId}/start-voting`);
         setToast({ type: 'success', message: 'Đã bắt đầu giai đoạn bình chọn (72 giờ).' });
         const updated = await api.get<ProjectDetail>(`/api/projects/${project.id}`);
         setProject(updated.data);
         if (updated.data.milestones) setMilestones(updated.data.milestones);
      } catch (err: any) {
         setToast({ type: 'error', message: err.response?.data?.message || 'Không thể bắt đầu bình chọn.' });
      } finally {
         setSaving(false);
      }
   };

   const handleProofSelected = async (url: string) => {
      if (!activeUploadMilestoneId || !project) return;
      try {
         await api.patch(`/api/projects/${project.id}/milestones/${activeUploadMilestoneId}/proof`, { evidenceUrls: [url] });
         setToast({ type: 'success', message: 'Đã nộp minh chứng thành công! Chờ Admin duyệt.' });
         setIsLibraryOpen(false);

         const updated = await api.get<ProjectDetail>(`/api/projects/${project.id}`);
         setProject(updated.data);
      } catch (err: any) {
         setToast({ type: 'error', message: err.response?.data?.message || 'Không thể nộp minh chứng.' });
      }
   };

   const addMilestone = () => {
      setMilestones([...milestones, { title: "Giai đoạn mới", percentage: 0, stage: milestones.length + 1 }]);
   };
   const removeMilestone = (idx: number) => {
      setMilestones(milestones.filter((_, i) => i !== idx));
   };
   const updateMilestone = (idx: number, field: string, value: string | number) => {
      const copy = [...milestones];
      (copy[idx] as any)[field] = value;
      setMilestones(copy);
   };

   if (loading) {
      return <div className="min-h-screen bg-background-light dark:bg-background-dark p-20 animate-pulse text-center">Đang tải cấu hình dự án...</div>;
   }

   if (!project) {
      return <div className="min-h-screen pt-20 text-center">Dự án không tồn tại!</div>;
   }

   const isPending = project.status === "pending";

   return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen font-display pb-20">
         <Navbar />

         {toast && (
            <div className="fixed top-20 right-5 z-[60]">
               <div className={`px-4 py-3 rounded-lg shadow-lg text-small font-semibold ${toast.type === "success" ? "bg-green-600" : "bg-red-600"} text-white`}>
                  {toast.message}
               </div>
            </div>
         )}

         <main className="wrapper wrapper--md py-10">
            <div className="flex justify-between items-center mb-8">
               <div>
                  <h1 className="text-h3 font-black">Quản lý Milestones</h1>
                  <p className="text-slate-500 mt-2">Dự án: <strong className="text-primary">{project.title}</strong></p>
               </div>
               <button onClick={() => router.back()} className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold hover:bg-slate-300 transition">
                  Trở về Dashboard
               </button>
            </div>

            {/* Milestone Configurator (Only when pending) */}
            {isPending ? (
               <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-10">
                  <h2 className="text-h5 font-bold mb-4">Cấu hình Tỷ lệ Giải ngân</h2>
                  <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-500 p-4 rounded-xl text-small mb-6 border border-amber-200 dark:border-amber-900/30">
                     Vì dự án đang ở trạng thái <strong>Draft (Pending)</strong>, bạn có thể tự do cấu hình lộ trình giải ngân. Lưu ý tổng tỷ lệ phải bằng đúng 100%. Khi dự án được Publish (Funding/Active), cấu hình này sẽ bị <strong>KHÓA</strong>.
                  </div>

                  <div className="space-y-4">
                     {milestones.map((m, idx) => (
                        <div key={idx} className="flex gap-4 items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                           <div className="size-10 bg-primary/10 flex items-center justify-center font-bold text-primary rounded-full shrink-0">
                              {idx + 1}
                           </div>
                           <input
                              type="text"
                              value={m.title}
                              onChange={(e) => updateMilestone(idx, 'title', e.target.value)}
                              placeholder="Tên giai đoạn..."
                              className="flex-1 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 pb-1 outline-none focus:border-primary transition"
                           />
                           <div className="flex items-center gap-2">
                              <input
                                 type="number"
                                 value={m.percentage}
                                 onChange={(e) => updateMilestone(idx, 'percentage', Number(e.target.value))}
                                 className="w-16 text-center bg-transparent border-b border-slate-300 dark:border-slate-700 pb-1 outline-none focus:border-primary text-primary font-bold"
                              />
                              <span className="font-bold text-slate-500">%</span>
                           </div>
                           <button onClick={() => removeMilestone(idx)} className="text-red-500 p-2 hover:bg-red-50 rounded-full transition" title="Xóa">
                              ✕
                           </button>
                        </div>
                     ))}

                     <button onClick={addMilestone} className="w-full border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl py-3 hover:bg-slate-50 hover:text-primary transition font-bold text-small">
                        + Thêm Giai Đoạn Mới
                     </button>
                  </div>

                  <div className="mt-8 flex justify-end">
                     <button
                        onClick={handleSaveMilestones}
                        disabled={saving}
                        className="px-8 py-3 bg-primary text-white font-bold rounded-xl disabled:opacity-50 hover:shadow-lg shadow-primary/30 transition-all"
                     >
                        {saving ? "Đang lưu cấu hình..." : "Lưu lộ trình Milestones"}
                     </button>
                  </div>
               </div>
            ) : (
               <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-10">
                  <h2 className="text-h5 font-bold mb-4">Lộ trình Giải ngân</h2>
                  <div className="space-y-4">
                     {project.milestones && project.milestones.length > 0 ? project.milestones.map((m: any, idx) => (
                        <div key={idx} className={`p-5 rounded-xl border flex justify-between gap-6 overflow-hidden relative ${m.status === 'disbursed' ? 'bg-green-50/50 border-green-200' :
                           m.status === 'admin_review' ? 'bg-amber-50/50 border-amber-200' :
                              m.status === 'uploading_proof' ? 'bg-primary/5 border-primary/20 shadow-sm border-2' :
                                 'bg-slate-50 border-slate-200 opacity-60'
                           }`}>
                           <div className="flex gap-4 items-start relative z-10 w-full">
                              <div className={`size-12 flex items-center justify-center font-bold text-lg rounded-full shrink-0 ${m.status === 'disbursed' ? 'bg-green-600 text-white' : 'bg-white shadow text-slate-700'
                                 }`}>
                                 {idx + 1}
                              </div>
                              <div className="w-full">
                                 <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-slate-900 dark:text-slate-900">{m.title}</h3>
                                    <p className="font-bold text-lg text-slate-900 dark:text-slate-900">{m.percentage}%</p>
                                 </div>

                                 <div className="mt-1 flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${m.status === 'disbursed' ? 'bg-green-100 text-green-700' :
                                       m.status === 'admin_review' ? 'bg-amber-100 text-amber-700' :
                                          m.status === 'uploading_proof' ? 'bg-primary text-white' :
                                             'bg-slate-200 text-slate-600'
                                       }`}>
                                       {m.status}
                                    </span>
                                 </div>

                                 {/* REJECTION REASON */}
                                 {m.rejectionReason && m.status === 'uploading_proof' && (
                                    <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-lg text-small border border-red-200 flex gap-2">
                                       <CircleAlert className="shrink-0" />
                                       <div>
                                          <p className="font-bold">Bằng chứng trước đó bị từ chối với lý do:</p>
                                          <p className="mt-1">"{m.rejectionReason}"</p>
                                       </div>
                                    </div>
                                 )}

                                 {/* UPLOAD ACTION BOUND TO MEDIA LIBRARY MODAL */}
                                 {m.status === 'uploading_proof' && (
                                    <div className="mt-4 flex gap-3">
                                       <button
                                          onClick={() => {
                                             setActiveUploadMilestoneId(m.id);
                                             setIsLibraryOpen(true);
                                          }}
                                          className="px-5 py-2 inline-flex items-center gap-2 bg-slate-900 text-white rounded-lg text-smaller font-bold hover:shadow-lg transition cursor-pointer"
                                       >
                                          <Images className="text-body" />
                                          Cập nhật bằng chứng
                                       </button>

                                       {(m.evidenceUrls?.length > 0 || m.proofUrl) && (
                                          <button
                                             onClick={() => handleStartVoting(m.id)}
                                             className="px-5 py-2 inline-flex items-center gap-2 bg-emerald-600 text-white rounded-lg text-smaller font-bold hover:shadow-lg transition cursor-pointer"
                                          >
                                             <CircleCheck className="text-body" />
                                             Bắt đầu bình chọn
                                          </button>
                                       )}
                                    </div>
                                 )}

                                 {m.proofUrl && m.status !== 'uploading_proof' && (
                                    <div className="mt-4 opacity-80 flex items-center gap-2">
                                       <CircleCheck className="text-small text-green-600" />
                                       <a href={m.proofUrl} target="_blank" className="font-bold text-small text-green-700 hover:underline">
                                          Đã nộp bằng chứng: Xem ngay
                                       </a>
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>
                     )) : (
                        <p className="text-smaller text-slate-500">Chưa cấu hình Milestones cho dự án này.</p>
                     )}
                  </div>
               </div>
            )}

         </main>

         {/* Media Library Setup */}
         <MediaLibraryModal
            isOpen={isLibraryOpen}
            onClose={() => {
               setIsLibraryOpen(false);
               setActiveUploadMilestoneId(null);
            }}
            onSelect={handleProofSelected}
         />
      </div>
   );
}
