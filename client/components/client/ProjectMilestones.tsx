"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/axios";
import { ProjectMilestone } from "@/types/project";
import { ProjectMilestonesProps } from "@/types/milestones";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  Image as ImageIcon, 
  ThumbsUp,
  ThumbsDown,
  Info,
  MessageSquare,
  Send,
  User,
  ShieldAlert
} from "lucide-react";

export default function ProjectMilestones({ project, role, currentUserId, onUpdate, setToast }: ProjectMilestonesProps) {
  const [loading, setLoading] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [voteComment, setVoteComment] = useState("");
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [activeMilestoneId, setActiveMilestoneId] = useState<number | null>(null);
  const [showDiscussions, setShowDiscussions] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const milestones = useMemo(() => project.milestones || [], [project.milestones]);
  const isOwner = role === "owner" && project.owner && project.owner.id === currentUserId;
  const isAdmin = role === "admin";

  useEffect(() => {
    if (showDiscussions) {
      fetchDiscussions(showDiscussions);
    }
  }, [showDiscussions]);

  if (!milestones.length) return null;

  const fetchDiscussions = async (milestoneId: number) => {
    try {
      const res = await api.get(`/api/projects/milestones/${milestoneId}/discussions`);
      setDiscussions(res.data);
    } catch (err) {
      console.error("Lỗi lấy thảo luận:", err);
    }
  };

  const handleAddEvidence = () => {
    if (evidenceUrl && !evidenceUrls.includes(evidenceUrl)) {
      setEvidenceUrls(prev => [...prev, evidenceUrl]);
      setEvidenceUrl("");
    }
  };

  const handleUploadProof = async (milestoneId: number) => {
    if (evidenceUrls.length === 0) {
      setToast({ type: "error", message: "Vui lòng thêm ít nhất một hình ảnh bằng chứng." });
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/api/projects/${project.id}/milestones/${milestoneId}/proof`, {
        evidenceUrls: evidenceUrls,
      });
      setToast({ type: "success", message: "Đã cập nhật bằng chứng. Bạn có thể nhấn 'Bắt đầu bình chọn' khi sẵn sàng." });
      setEvidenceUrls([]);
      setActiveMilestoneId(null);
      onUpdate();
    } catch (err: any) {
      setToast({ type: "error", message: err.response?.data?.message || "Lỗi cập nhật bằng chứng" });
    } finally {
      setLoading(false);
    }
  };

  const handleStartVoting = async (milestoneId: number) => {
    setLoading(true);
    try {
      await api.post(`/api/projects/milestones/${milestoneId}/start-voting`);
      setToast({ type: "success", message: "Đã bắt đầu giai đoạn bình chọn (72 giờ)." });
      onUpdate();
    } catch (err: any) {
      setToast({ type: "error", message: err.response?.data?.message || "Lỗi bắt đầu bình chọn" });
    } finally {
      setLoading(false);
    }
  };

  const handleVoteRest = async (milestoneId: number, isApprove: boolean) => {
    if (!voteComment && !isApprove) {
      setToast({ type: "error", message: "Vui lòng nhập lý do nếu bạn chọn 'Chưa đủ'." });
      return;
    }
    setLoading(true);
    try {
      await api.post(`/api/projects/milestones/${milestoneId}/vote`, { isApprove, comment: voteComment });
      setToast({ type: "success", message: `Bạn đã bình chọn ${isApprove ? 'ĐỒNG Ý' : 'KHÔNG ĐỒNG Ý'}.` });
      setVoteComment("");
      onUpdate();
    } catch (err: any) {
      setToast({ type: "error", message: err.response?.data?.message || "Lỗi gửi bình chọn" });
    } finally {
      setLoading(false);
    }
  };

  const handleOwnerResponse = async (milestoneId: number) => {
    if (!replyContent) return;
    setLoading(true);
    try {
      await api.post(`/api/projects/milestones/${milestoneId}/response`, { content: replyContent });
      setReplyContent("");
      fetchDiscussions(milestoneId);
      setToast({ type: "success", message: "Đã gửi phản hồi cho Admin." });
    } catch (err: any) {
      setToast({ type: "error", message: "Lỗi gửi phản hồi" });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateTime = async (milestoneId: number) => {
    setLoading(true);
    try {
      await api.post(`/api/admin/projects/milestones/${milestoneId}/simulate-time`);
      setToast({ type: "success", message: "Đã tua nhanh thời gian thành công (Voting kết thúc hoặc Interval kết thúc)." });
      onUpdate();
    } catch (err: any) {
      setToast({ type: "error", message: "Lỗi tua nhanh thời gian." });
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'disbursed':
      case 'completed':
        return { color: 'text-green-500', icon: CheckCircle2, label: 'Hoàn thành' };
      case 'voting':
        return { color: 'text-yellow-500', icon: Clock, label: 'Đang bình chọn' };
      case 'uploading_proof':
        return { color: 'text-blue-500', icon: ImageIcon, label: 'Chờ bằng chứng' };
      case 'disputed':
        return { color: 'text-red-500', icon: AlertCircle, label: 'Tranh chấp' };
      case 'admin_review':
        return { color: 'text-orange-500', icon: Clock, label: 'Đang xét duyệt' };
      case 'rejected':
        return { color: 'text-slate-500', icon: ShieldAlert, label: 'Đã hủy/Từ chối' };
      case 'waiting_interval':
        return { color: 'text-indigo-500', icon: Clock, label: 'Đang trong giai đoạn chờ' };
      default:
        return { color: 'text-slate-400', icon: Circle, label: 'Chờ xử lý' };
    }
  };

  return (
    <div className="col-span-1 md:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mt-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-h6 font-black text-slate-900 dark:text-white">Lộ trình dự án & Giải ngân</h2>
        <p className="text-smaller text-slate-500 mt-1">Theo dõi tiến độ và tham gia bình chọn giải ngân.</p>
      </div>

      <div className="space-y-6 relative">
        <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-slate-100 dark:bg-slate-800"></div>
        {milestones.sort((a,b) => a.stage - b.stage).map((m: ProjectMilestone) => {
          const config = getStatusConfig(m.status);
          const Icon = config.icon;
          const isVotingOpen = m.status === 'voting';
          const isDisputed = m.status === 'disputed' || m.status === 'admin_review';

          // Countdown calculation
          let hoursLeft = 0;
          if (m.votingEndsAt) {
            const end = new Date(m.votingEndsAt).getTime();
            const now = new Date().getTime();
            hoursLeft = Math.max(0, Math.floor((end - now) / (1000 * 60 * 60)));
          }

          const isWaitingInterval = 
            m.status === 'pending' && 
            m.nextDisbursementDate && 
            new Date(m.nextDisbursementDate).getTime() > new Date().getTime();

          const currentConfig = isWaitingInterval ? getStatusConfig('waiting_interval') : config;
          const CurrentIcon = currentConfig.icon;

          return (
            <div key={m.id} className="relative pl-12 group">
              <div className={`absolute left-[11px] top-1 z-10 p-1 bg-white dark:bg-slate-900 rounded-full transition-transform group-hover:scale-110`}>
                <CurrentIcon className={`w-5 h-5 ${currentConfig.color}`} />
              </div>

              <div className={`bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border ${isDisputed ? 'border-red-200 dark:border-red-900/30 bg-red-50/30' : isWaitingInterval ? 'border-indigo-200 dark:border-indigo-900/30 bg-indigo-50/10' : 'border-slate-200 dark:border-slate-800'} hover:border-primary/30 transition-all duration-300`}>
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-smaller font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">Giai đoạn {m.stage}</span>
                      <span className="text-small font-black text-slate-800 dark:text-slate-200">{m.title}</span>
                      {isVotingOpen && (
                        <span className="ml-auto md:ml-0 text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full animate-pulse">
                          Còn {hoursLeft}h
                        </span>
                      )}
                    </div>
                    <p className="text-smaller text-slate-600 dark:text-slate-400 mb-3">{m.content || "Chưa có mô tả chi tiết."}</p>
                    
                    <div className="flex flex-wrap gap-4 items-center">
                      <div className="flex items-center gap-1.5 text-smaller font-semibold text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                        Tỷ lệ: {m.percentage}%
                      </div>
                      <div className={`flex items-center gap-1.5 text-smaller font-bold ${currentConfig.color}`}>
                         {currentConfig.label}
                      </div>

                      {isWaitingInterval && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">
                          Mở lại vào: {new Date(m.nextDisbursementDate!).toLocaleDateString('vi-VN')}
                        </div>
                      )}

                      {m.evidenceUrls && m.evidenceUrls.length > 0 && (
                        <div className="flex gap-2">
                           {m.evidenceUrls.map((url, i) => (
                             <a key={i} href={url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded border dark:border-slate-700 overflow-hidden hover:scale-110 transition-transform">
                               {/* eslint-disable-next-line @next/next/no-img-element */}
                               <img src={url} alt="evidence" className="w-full h-full object-cover" />
                             </a>
                           ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 justify-center min-w-[200px]">
                    {/* Owner Response Area */}
                    {isOwner && (m.status === 'uploading_proof' || (m.status === 'pending' && !isWaitingInterval && m.stage > 1)) && (
                      <div className="flex flex-col gap-2">
                         {activeMilestoneId === m.id ? (
                           <div className="space-y-2">
                              <div className="flex gap-2">
                                <input 
                                  placeholder="Dán URL ảnh bằng chứng..." 
                                  className="px-3 py-1.5 text-small border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 w-full"
                                  value={evidenceUrl}
                                  onChange={e => setEvidenceUrl(e.target.value)}
                                />
                                <button type="button" onClick={handleAddEvidence} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">+</button>
                              </div>
                              {evidenceUrls.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {evidenceUrls.map((u, i) => <div key={i} className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">Ảnh {i+1}</div>)}
                                </div>
                              )}
                              <div className="flex gap-2">
                                <button type="button" onClick={() => handleUploadProof(m.id)} className="flex-1 py-1.5 bg-primary text-white text-small rounded-lg font-bold">Cập nhật</button>
                                <button type="button" onClick={() => setActiveMilestoneId(null)} className="px-3 py-1.5 text-small text-slate-500">Hủy</button>
                              </div>
                           </div>
                         ) : (
                           <div className="flex flex-col gap-2">
                             <button type="button" onClick={() => setActiveMilestoneId(m.id)} className="px-4 py-2 bg-primary text-white text-smaller rounded-lg font-bold shadow-sm hover:shadow-md transition-all">Nộp bằng chứng</button>
                             {m.evidenceUrls && m.evidenceUrls.length > 0 && (
                                <button type="button" onClick={() => handleStartVoting(m.id)} className="px-4 py-2 bg-emerald-600 text-white text-smaller rounded-lg font-bold">Bắt đầu bình chọn</button>
                             )}
                           </div>
                         )}
                      </div>
                    )}

                    {/* Investor Voting Actions */}
                    {isVotingOpen && (
                      <div className="flex flex-col gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-yellow-200 dark:border-yellow-900/50 shadow-sm">
                        {role === 'investor' ? (
                          <>
                            <textarea 
                              placeholder="Góp ý cho chủ dự án..."
                              className="w-full p-2 text-[11px] border dark:border-slate-700 rounded-lg outline-none focus:ring-1 ring-primary"
                              value={voteComment}
                              onChange={e => setVoteComment(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <button type="button" onClick={() => handleVoteRest(m.id, true)} className="flex-1 py-1.5 bg-green-50 text-green-600 border border-green-200 rounded-lg font-bold hover:bg-green-100 flex items-center justify-center gap-1 text-smaller">
                                <ThumbsUp className="w-3 h-3" /> ĐỦ
                              </button>
                              <button type="button" onClick={() => handleVoteRest(m.id, false)} className="flex-1 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg font-bold hover:bg-red-100 flex items-center justify-center gap-1 text-smaller">
                                <ThumbsDown className="w-3 h-3" /> CHƯA ĐỦ
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="text-smaller text-yellow-600 font-bold flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Đang bình chọn...
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dispute / Mediation Area */}
                    {isDisputed && (isAdmin || isOwner) && (
                      <button 
                        onClick={() => setShowDiscussions(m.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-bold text-smaller"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Tranh chấp & Phản hồi
                      </button>
                    )}

                    {isAdmin && (m.status === 'voting' || isWaitingInterval) && (
                      <button 
                         onClick={() => handleSimulateTime(m.id)}
                         disabled={loading}
                         className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl font-bold text-smaller hover:bg-indigo-600 transition-all"
                      >
                         <Clock className="w-4 h-4" />
                         Tua nhanh thời gian (Demo)
                      </button>
                    )}
                  </div>
                </div>

                {/* Discussions List Overlay/Expansion */}
                {showDiscussions === m.id && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-smaller font-black flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-orange-500" />
                        Hội thoại Tranh chấp
                      </h4>
                      <button onClick={() => setShowDiscussions(null)} className="text-[10px] text-slate-500 hover:underline">Đóng</button>
                    </div>

                    <div className="space-y-3 max-h-60 overflow-y-auto mb-4 pr-2">
                      {discussions.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic text-center py-4">Chưa có hội thoại nào giữa Admin và Owner.</p>
                      ) : (
                        discussions.map((d, index) => (
                          <div key={index} className={`flex gap-3 ${d.senderId === currentUserId ? 'flex-row-reverse' : ''}`}>
                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                               <User className="w-3 h-3 text-slate-500" />
                            </div>
                            <div className={`p-3 rounded-2xl text-smaller max-w-[80%] ${d.senderId === currentUserId ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                              {d.content}
                              <div className={`text-[9px] mt-1 opacity-60`}>{new Date(d.createdAt).toLocaleString()}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Reply Input (Owner only, Admin uses their dashboard usually but can be here too) */}
                    {(isOwner || isAdmin) && (
                      <div className="flex gap-2">
                        <input 
                          className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-smaller outline-none focus:ring-1 ring-primary"
                          placeholder="Nhập nội dung phản hồi..."
                          value={replyContent}
                          onChange={e => setReplyContent(e.target.value)}
                        />
                        <button 
                          onClick={() => handleOwnerResponse(m.id)}
                          disabled={loading || !replyContent}
                          className="p-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
