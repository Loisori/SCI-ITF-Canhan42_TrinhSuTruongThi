"use client";

//services
import { useState } from "react";
import api from "@/lib/axios";

//types
import { ProjectMilestone } from "@/types/project";
import { ProjectMilestonesProps } from "@/types/milestones";

export default function ProjectMilestones({ project, role, onUpdate, setToast }: ProjectMilestonesProps) {
  const [loading, setLoading] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [activeMilestoneId, setActiveMilestoneId] = useState<number | null>(null);

  const milestones = project.milestones || [];
  const isOwner = role === "owner"; // Wait, in page.tsx role is either "investor" or we check project.owner.id
  // Actually, we should check if current user is owner. But role is just string right now. Let's pass it.

  if (!milestones.length) return null;

  const handleUploadProof = async (milestoneId: number) => {
    if (!proofUrl) return;
    setLoading(true);
    try {
      await api.patch(`/api/projects/${project.id}/milestones/${milestoneId}/proof`, {
        proofUrl,
      });
      setToast({ type: "success", message: "Đã tải lên bằng chứng thành công. Chờ Admin duyệt." });
      setProofUrl("");
      setActiveMilestoneId(null);
      onUpdate();
    } catch (err: any) {
      setToast({ type: "error", message: err.response?.data?.message || "Lỗi tải ảnh" });
    } finally {
      setLoading(false);
    }
  };

  const handleDispute = async () => {
    if (!disputeReason) return;
    setLoading(true);
    try {
      await api.post(`/api/projects/${project.id}/disputes`, {
        reason: disputeReason,
      });
      setToast({ type: "success", message: "Đã gửi khiếu nại tiến độ." });
      setShowDisputeModal(false);
      setDisputeReason("");
      onUpdate();
    } catch (err: any) {
      setToast({ type: "error", message: err.response?.data?.message || "Lỗi gửi khiếu nại" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 mt-6">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-h6 font-bold">Tiến độ giải ngân (Milestones)</h2>
        {role === "investor" && !project.isFrozen && (
          <button 
            onClick={() => setShowDisputeModal(true)}
            className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-smaller font-semibold hover:bg-red-100 dark:hover:bg-red-900/40"
          >
            Khiếu nại tiến độ
          </button>
        )}
        {project.isFrozen && (
          <span className="px-3 py-1.5 bg-red-100 text-red-600 font-bold rounded-lg text-smaller">
            Dự án đang bị đóng băng do khiếu nại!
          </span>
        )}
      </div>

      <div className="space-y-4 relative">
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
        {milestones.sort((a,b) => a.stage - b.stage).map((m: ProjectMilestone) => {
          let dotColor = "bg-slate-300";
          let statusText = "Chờ xử lý";
          if (m.status === "disbursed") {
            dotColor = "bg-green-500";
            statusText = "Đã giải ngân";
          } else if (m.status === "admin_review") {
            dotColor = "bg-orange-500";
            statusText = "Đang xét duyệt";
          } else if (m.status === "uploading_proof") {
            dotColor = "bg-blue-500";
            statusText = "Cần nộp bằng chứng";
          }

          return (
            <div key={m.id} className="relative pl-10">
              <div className={`absolute left-[11px] top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${dotColor}`}></div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">{m.title}</h4>
                  <p className="text-smaller text-slate-500 mb-2">Trạng thái: {statusText}</p>
                  {m.proofUrl && (
                    <a href={m.proofUrl} target="_blank" rel="noreferrer" className="text-primary text-smaller underline">
                      Xem bằng chứng
                    </a>
                  )}
                </div>
                {/* For Owner, show upload button if uploading_proof */}
                {m.status === "uploading_proof" && role === "business" && !project.isFrozen && (
                  <div className="mt-3 sm:mt-0 flex gap-2 w-full sm:w-auto">
                    {activeMilestoneId === m.id ? (
                      <div className="flex w-full gap-2">
                        <input 
                          type="text" 
                          placeholder="URL Bằng chứng (ảnh/video)" 
                          className="px-3 py-1 border rounded text-smaller flex-1"
                          value={proofUrl}
                          onChange={e => setProofUrl(e.target.value)}
                        />
                        <button 
                          onClick={() => handleUploadProof(m.id)}
                          disabled={loading}
                          className="px-3 py-1 bg-primary text-white text-smaller rounded font-bold whitespace-nowrap"
                        >
                          Gửi
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setActiveMilestoneId(m.id)}
                        className="px-4 py-2 bg-primary text-white text-smaller rounded-lg font-bold"
                      >
                        Nộp bằng chứng
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-h5 font-bold mb-2">Khiếu nại tiến độ</h3>
            <p className="text-smaller text-slate-600 dark:text-slate-400 mb-4">
              Bạn nhận thấy chủ dự án không cập nhật hoặc có dấu hiệu không minh bạch? Gửi khiếu nại để cảnh báo.
            </p>
            <textarea
              className="w-full h-24 p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-small mb-4 outline-none focus:border-primary"
              placeholder="Vui lòng nhập lý do (VD: Quá hạn 2 tuần chưa thấy update đợt 2...)"
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowDisputeModal(false)}
                className="px-4 py-2 text-slate-600 font-semibold"
              >
                Hủy
              </button>
              <button 
                onClick={handleDispute}
                disabled={loading || !disputeReason}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg disabled:opacity-50"
              >
                Gửi Khiếu Nại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
