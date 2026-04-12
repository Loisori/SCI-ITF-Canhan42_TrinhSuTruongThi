"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { ProjectDetail } from "@/types/project";
import { 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  Send, 
  History,
  RotateCcw,
  Ban
} from "lucide-react";

export default function AdminDisputesPage() {
  const [projects, setProjects] = useState<ProjectDetail[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projects' | 'milestones'>('projects');
  
  // Mediation state
  const [selectedMilestone, setSelectedMilestone] = useState<any | null>(null);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [feedback, setFeedback] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, mileRes] = await Promise.all([
        api.get("/api/admin/projects/disputes"),
        api.get("/api/admin/projects/milestones/disputed")
      ]);
      setProjects(projRes.data);
      setMilestones(mileRes.data);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResolveProject = async (projectId: number, action: 'dismiss' | 'refund') => {
    if (!confirm(action === 'dismiss' ? "Bỏ qua khiếu nại?" : "HOÀN TIỀN?")) return;
    try {
      await api.post(`/api/admin/projects/${projectId}/disputes/resolve`, { action });
      fetchData();
    } catch (err: any) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  // Milestone Mediation Actions
  const openMediation = async (m: any) => {
    setSelectedMilestone(m);
    try {
      const res = await api.get(`/api/projects/milestones/${m.id}/discussions`);
      setDiscussions(res.data);
    } catch (err) {
      console.error("Lỗi lấy thảo luận:", err);
    }
  };

  const sendFeedback = async () => {
    if (!feedback || !selectedMilestone) return;
    try {
      await api.post(`/api/admin/projects/milestones/${selectedMilestone.id}/feedback`, { content: feedback });
      setFeedback("");
      openMediation(selectedMilestone);
    } catch (err) {
      alert("Lỗi gửi phản hồi");
    }
  };

  const resetVote = async (mId: number) => {
    if (!confirm("Cho phép bình chọn lại từ đầu?")) return;
    try {
      await api.post(`/api/admin/projects/milestones/${mId}/reset-vote`);
      alert("Đã reset bầu chọn!");
      setSelectedMilestone(null);
      fetchData();
    } catch (err) {
      alert("Lỗi reset");
    }
  };

  const terminateProject = async (pId: number) => {
    const reason = prompt("Lý do hủy dự án:");
    if (!reason) return;
    if (!confirm("XÁC NHẬN HỦY DỰ ÁN VÀ HOÀN TIỀN CHO NHÀ ĐẦU TƯ?")) return;
    try {
      await api.post(`/api/admin/projects/${pId}/terminate`, { reason });
      alert("Đã hủy dự án và hoàn tiền!");
      setSelectedMilestone(null);
      fetchData();
    } catch (err) {
      alert("Lỗi hủy dự án");
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-h4 font-black">Trung tâm Trọng tài & Tranh chấp</h1>
          <p className="text-slate-500">Giải quyết khiếu nại dự án và điều phối Milestone bị phản đối.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('projects')}
            className={`pb-4 px-2 font-bold transition-all ${activeTab === 'projects' ? 'border-b-2 border-primary text-primary' : 'text-slate-400'}`}
          >
            Tranh chấp Dự án ({projects.length})
          </button>
          <button 
            onClick={() => setActiveTab('milestones')}
            className={`pb-4 px-2 font-bold transition-all ${activeTab === 'milestones' ? 'border-b-2 border-primary text-primary' : 'text-slate-400'}`}
          >
            Điều phối Milestone ({milestones.length})
          </button>
        </div>

        {loading ? (
          <div className="animate-pulse flex flex-col gap-4">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>)}
          </div>
        ) : activeTab === 'projects' ? (
          <div className="space-y-6">
            {projects.length === 0 ? (
               <div className="bg-white rounded-xl p-12 text-center text-slate-400 border border-dashed border-slate-300">Không có tranh chấp dự án nào.</div>
            ) : (
              projects.map(project => (
                <div key={project.id} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="font-black text-h6 text-slate-900">{project.title}</h2>
                      <div className="flex gap-4 mt-1 text-smaller text-slate-500">
                         <span>ID: {project.id}</span>
                         <span>Chủ: {project.owner?.fullName}</span>
                         <span>Ngày tạo: {new Date(project.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleResolveProject(project.id, 'dismiss')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-smaller transition-all">Bỏ qua</button>
                      <button onClick={() => handleResolveProject(project.id, 'refund')} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-smaller shadow-lg shadow-red-500/20 transition-all">Hoàn tiền & Đóng</button>
                    </div>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/30">
                    <h3 className="font-bold text-red-800 dark:text-red-400 mb-3 flex items-center gap-2">
                       <AlertCircle className="w-4 h-4" />
                       Báo cáo từ nhà đầu tư ({project.disputes?.length || 0})
                    </h3>
                    <div className="space-y-2">
                      {project.disputes?.map((d: any) => (
                        <div key={d.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-red-100 dark:border-red-900/20 text-smaller shadow-sm">
                          <div className="flex justify-between font-bold mb-1">
                             <span className="text-slate-700 dark:text-slate-300">User #{d.userId}</span>
                             <span className="text-[10px] text-slate-400 font-medium">{new Date(d.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400">{d.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* List */}
            <div className="lg:col-span-1 space-y-4">
               {milestones.length === 0 ? (
                 <div className="bg-white rounded-xl p-8 text-center text-slate-400 border border-slate-200">Trống.</div>
               ) : (
                 milestones.map(m => (
                   <div 
                    key={m.id} 
                    onClick={() => openMediation(m)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedMilestone?.id === m.id ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'bg-white border-slate-200 hover:border-primary/50 text-slate-900'}`}
                   >
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Giai đoạn {m.stage}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${m.status === 'admin_review' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                           {m.status === 'admin_review' ? 'ĐANG XỬ LÝ' : 'BỊ PHẢN ĐỐI'}
                        </span>
                     </div>
                     <h3 className="font-bold text-small line-clamp-1">{m.title}</h3>
                     <p className={`text-[11px] mt-1 ${selectedMilestone?.id === m.id ? 'text-white/80' : 'text-slate-500'}`}>Dự án: {m.project?.title}</p>
                   </div>
                 ))
               )}
            </div>

            {/* Mediation Panel */}
            <div className="lg:col-span-2">
               {selectedMilestone ? (
                 <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-300">
                    <div className="p-6 bg-slate-900 text-white">
                       <div className="flex justify-between items-start">
                          <div>
                             <h2 className="text-h6 font-black">{selectedMilestone.title}</h2>
                             <p className="text-smaller text-white/60">Giai đoạn {selectedMilestone.stage} • <strong>{selectedMilestone.project?.title}</strong></p>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => resetVote(selectedMilestone.id)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all" title="Bình chọn lại"><RotateCcw className="w-5 h-5" /></button>
                             <button onClick={() => terminateProject(selectedMilestone.project.id)} className="p-2 bg-red-500 hover:bg-red-600 rounded-xl transition-all" title="Hủy dự án"><Ban className="w-5 h-5" /></button>
                          </div>
                       </div>
                    </div>

                    <div className="p-6">
                       <div className="flex items-center gap-2 mb-4 text-smaller font-black border-l-4 border-orange-500 pl-3">
                          <History className="w-4 h-4" /> THẢO LUẬN VỚI CHỦ DỰ ÁN
                       </div>
                       
                       <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto px-2">
                          {discussions.map((d, i) => (
                            <div key={i} className={`flex gap-3 ${d.senderId === selectedMilestone.project.ownerId ? '' : 'flex-row-reverse'}`}>
                               <div className={`p-4 rounded-3xl text-smaller max-w-[85%] ${d.senderId === selectedMilestone.project.ownerId ? 'bg-slate-100 text-slate-800 rounded-tl-none' : 'bg-primary text-white rounded-tr-none shadow-md'}`}>
                                  <div className="font-black text-[10px] mb-1 opacity-70">{d.senderId === selectedMilestone.project.ownerId ? 'OWNER' : 'ADMIN'}</div>
                                  {d.content}
                                  <div className="text-[9px] mt-2 opacity-50 text-right">{new Date(d.createdAt).toLocaleString()}</div>
                               </div>
                            </div>
                          ))}
                          {discussions.length === 0 && <div className="text-center py-12 text-slate-400 italic text-smaller">Bắt đầu hội thoại để yêu cầu chủ dự án giải trình...</div>}
                       </div>

                       <div className="relative pt-4 border-t border-slate-100">
                          <textarea 
                            className="w-full bg-slate-50 rounded-2xl p-4 pr-16 text-small min-h-[100px] border-none focus:ring-1 ring-primary outline-none"
                            placeholder="Gửi yêu cầu giải trình cho chủ dự án..."
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                          />
                          <button 
                            onClick={sendFeedback}
                            disabled={!feedback}
                            className="absolute right-4 bottom-8 p-3 bg-slate-900 text-white rounded-2xl hover:bg-primary transition-all disabled:opacity-50"
                          >
                             <Send className="w-5 h-5" />
                          </button>
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                       <MessageSquare className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="font-black text-slate-400">Chọn một Milestone để bắt đầu điều phối</h3>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
