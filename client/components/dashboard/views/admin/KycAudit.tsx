"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { ShieldCheck, XCircle, Eye, User, FileText, Check, X, AlertOctagon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface KycRecord {
  id: number;
  idCardNumber: string;
  frontImageUrl: string;
  backImageUrl: string;
  status: string;
  user: {
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
}

export default function KycAudit() {
  const [selectedKyc, setSelectedKyc] = useState<KycRecord | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const { data: kycs = [], refetch } = useQuery({
    queryKey: ["admin-pending-kycs"],
    queryFn: async () => (await api.get<KycRecord[]>("/api/users/kyc/pending")).data,
  });

  const handleApprove = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn duyệt yêu cầu KYC này?")) return;
    try {
      await api.patch(`/api/users/kyc/${id}/approve`);
      toast.success("Đã duyệt KYC thành công.");
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi phê duyệt");
    }
  };

  const handleReject = async () => {
    if (!selectedKyc || !rejectReason) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }
    try {
      await api.patch(`/api/users/kyc/${selectedKyc.id}/reject`, { reason: rejectReason });
      toast.success("Đã từ chối KYC.");
      setShowRejectModal(false);
      setSelectedKyc(null);
      setRejectReason("");
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi từ chối");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-h3 font-black text-slate-900 dark:text-white">Duyệt định danh (KYC)</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Kiểm tra và xác thực thông tin cá nhân của người dùng.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {kycs.map((kyc) => (
          <div key={kyc.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                  {kyc.user.avatarUrl ? (
                    <img src={kyc.user.avatarUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{kyc.user.fullName}</p>
                  <p className="text-[11px] font-bold text-slate-500">{kyc.user.email}</p>
                  <p className="text-[10px] font-bold text-primary flex items-center gap-1 mt-1">
                    <FileText className="w-3 h-3" /> CCCD: {kyc.idCardNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setLightbox({ url: `/api/users/kyc/image/${kyc.id}/front`, title: `Mặt trước - ${kyc.user.fullName}` })}
                    className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all flex items-center gap-2 group"
                  >
                    <Eye className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase hidden group-hover:block">Mặt trước</span>
                  </button>
                  <button
                    onClick={() => setLightbox({ url: `/api/users/kyc/image/${kyc.id}/back`, title: `Mặt sau - ${kyc.user.fullName}` })}
                    className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all flex items-center gap-2 group"
                  >
                    <Eye className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase hidden group-hover:block">Mặt sau</span>
                  </button>
                </div>

                <div className="h-10 w-px bg-slate-100 dark:bg-slate-800 mx-2 hidden md:block" />

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedKyc(kyc);
                      setShowRejectModal(true);
                    }}
                    className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleApprove(kyc.id)}
                    className="p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-600 hover:text-white transition-all"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {kycs.length === 0 && (
          <div className="py-20 text-center bg-slate-50 dark:bg-slate-950 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
             <ShieldCheck className="w-16 h-16 text-slate-200 mx-auto mb-4" />
             <p className="text-slate-500 font-bold">Không có yêu cầu KYC nào đang chờ.</p>
          </div>
        )}
      </div>

      {/* Lightbox / Image Viewer */}
      <AnimatePresence>
        {lightbox && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-12 bg-slate-900/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full h-full flex flex-col items-center justify-center"
            >
              <div className="absolute top-0 w-full flex justify-between items-center text-white mb-8">
                <h3 className="text-xl font-black">{lightbox.title}</h3>
                <button onClick={() => setLightbox(null)} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <img src={lightbox.url} className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl border-4 border-white/10" />
            </motion.div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedKyc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-8"
            >
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6">
                <AlertOctagon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Từ chối KYC</h3>
              <p className="text-smaller text-slate-500 mb-6 font-medium">Lý do từ chối định danh của <strong>{selectedKyc.user.fullName}</strong>:</p>
              
              <textarea
                autoFocus
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="VD: Ảnh mờ, thông tin không khớp..."
                className="w-full h-32 px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 ring-primary outline-none resize-none mb-6 font-medium"
              />

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedKyc(null);
                    setRejectReason("");
                  }}
                  className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Xác nhận từ chối
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
