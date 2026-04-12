"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, CheckCircle, AlertCircle, Clock, ShieldCheck, Eye, X } from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

interface KycRecord {
  id: number;
  idCardNumber: string;
  frontImageUrl: string;
  backImageUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

export default function KycView({ profile }: { profile: any }) {
  const [kyc, setKyc] = useState<KycRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [idCardNumber, setIdCardNumber] = useState("");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string>("");
  const [backPreview, setBackPreview] = useState<string>("");

  useEffect(() => {
    fetchKycStatus();
  }, []);

  const fetchKycStatus = async () => {
    try {
      const res = await api.get("/api/users/kyc/status");
      if (res.data) {
        setKyc(res.data);
        setIdCardNumber(res.data.idCardNumber);
      }
    } catch (err) {
      console.error("Error fetching KYC status", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'front') {
        setFrontFile(file);
        setFrontPreview(URL.createObjectURL(file));
      } else {
        setBackFile(file);
        setBackPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCardNumber || (!frontFile && !kyc?.frontImageUrl) || (!backFile && !kyc?.backImageUrl)) {
      toast.error("Vui lòng nhập đầy đủ thông tin và hình ảnh.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // 1. Upload images first if they are new
      let frontUrl = kyc?.frontImageUrl || "";
      let backUrl = kyc?.backImageUrl || "";

      if (frontFile) {
        const formData = new FormData();
        formData.append("file", frontFile);
        const res = await api.post("/api/users/kyc/upload", formData);
        frontUrl = res.data.url;
      }

      if (backFile) {
        const formData = new FormData();
        formData.append("file", backFile);
        const res = await api.post("/api/users/kyc/upload", formData);
        backUrl = res.data.url;
      }

      // 2. Submit KYC
      await api.post("/api/users/kyc", {
        idCardNumber,
        frontImageUrl: frontUrl,
        backImageUrl: backUrl,
      });


      toast.success("Đã gửi yêu cầu xác thực KYC.");
      fetchKycStatus();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi gửi KYC");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-h3 font-black text-slate-900 dark:text-white">Xác thực định danh (KYC)</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Hoàn tất KYC để mở khóa tính năng tạo dự án và rút tiền.
        </p>
      </div>

      {kyc?.status === 'APPROVED' ? (
        <div className="bg-green-500 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-green-500/20">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-black">Tài khoản đã được xác thực!</h2>
            <p className="opacity-80 font-medium">Bạn đã có đầy đủ quyền hạn để huy động vốn và giao dịch trên InvestPro.</p>
          </div>
        </div>
      ) : kyc?.status === 'PENDING' ? (
        <div className="bg-amber-500 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-amber-500/20">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <Clock className="w-10 h-10" />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-black">Đang chờ phê duyệt...</h2>
            <p className="opacity-80 font-medium">Hệ thống đang kiểm tra thông tin của bạn. Quá trình này thường mất từ 2-24 giờ.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {kyc?.status === 'REJECTED' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-3xl flex gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <h4 className="font-bold text-red-900 dark:text-red-400">Yêu cầu bị từ chối</h4>
                <p className="text-smaller text-red-800 dark:text-red-500 mt-1">Lý do: {kyc.rejectionReason}</p>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-8">
            <div>
              <label className="text-smaller font-black text-slate-900 dark:text-white mb-4 block">Số CMND / CCCD</label>
              <input
                type="text"
                value={idCardNumber}
                onChange={(e) => setIdCardNumber(e.target.value)}
                placeholder="Nhập 12 số trên thẻ"
                className="w-full px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 focus:border-primary outline-none transition-all text-lg font-bold"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Mặt trước */}
              <div className="space-y-4">
                <label className="text-smaller font-black text-slate-900 dark:text-white block">Mặt trước CCCD</label>
                <div 
                  className="aspect-video rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-primary transition-colors"
                  onClick={() => document.getElementById('front-input')?.click()}
                >
                  {(frontPreview || kyc?.frontImageUrl) ? (
                    <img src={frontPreview || kyc?.frontImageUrl} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-slate-300 group-hover:text-primary mb-2 transition-colors" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Tải ảnh lên</p>
                    </>
                  )}
                  <input id="front-input" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'front')} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-bold text-[10px] uppercase">Thay đổi ảnh</div>
                </div>
              </div>

              {/* Mặt sau */}
              <div className="space-y-4">
                <label className="text-smaller font-black text-slate-900 dark:text-white block">Mặt sau CCCD</label>
                <div 
                  className="aspect-video rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-primary transition-colors"
                  onClick={() => document.getElementById('back-input')?.click()}
                >
                  {(backPreview || kyc?.backImageUrl) ? (
                    <img src={backPreview || kyc?.backImageUrl} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-slate-300 group-hover:text-primary mb-2 transition-colors" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Tải ảnh lên</p>
                    </>
                  )}
                   <input id="back-input" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'back')} />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-bold text-[10px] uppercase">Thay đổi ảnh</div>
                </div>
              </div>
            </div>

            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full py-5 bg-primary text-white font-black text-lg rounded-3xl hover:shadow-2xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {isSubmitting ? "Đang xử lý..." : "Gửi yêu cầu xác thực"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
