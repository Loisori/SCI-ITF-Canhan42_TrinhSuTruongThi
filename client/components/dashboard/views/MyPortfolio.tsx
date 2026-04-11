"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { formatVnd } from "@/lib/utils";
import { UserProfile } from "@/types/user";
import { Investment } from "@/types/investment";
import Link from "next/link";
import toast from "react-hot-toast";
import { Image, Eye, TriangleAlert, FolderClosed } from "lucide-react";

export default function MyPortfolio({ profile }: { profile: UserProfile }) {
  const [disputingId, setDisputingId] = useState<number | null>(null);
  const [disputeReason, setDisputeReason] = useState("");

  const { data: investments = [], refetch } = useQuery({
    queryKey: ["investments-my"],
    queryFn: async () => (await api.get<Investment[]>("/api/investments/my-investments")).data,
  });

  const handleDispute = async (projectId: number) => {
    if (!disputeReason) {
      toast.error("Vui lòng nhập lý do khiếu nại");
      return;
    }
    try {
      await api.post(`/api/projects/${projectId}/disputes`, { reason: disputeReason });
      toast.success("Khiếu nại đã được gửi thành công.");
      setDisputingId(null);
      setDisputeReason("");
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể gửi khiếu nại");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-h3 font-bold text-slate-900 dark:text-white">Danh mục đầu tư</h1>
        <p className="text-slate-600 dark:text-slate-400 text-body mt-1">Theo dõi các khoản đầu tư và tiến độ dự án.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {investments.map((inv) => (
          <div key={inv.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm group transition-all hover:border-primary/30">
            <div className="flex flex-col justify-between gap-6">
              <div className="">
                {inv.project?.thumbnailUrl ? (
                  <img src={inv.project.thumbnailUrl} alt="" className="w-full h-[20rem] rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-full h-[20rem] rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <Image className="text-slate-300" />
                  </div>
                )}
              </div>
              <div className="">
                <div className="min-w-0">
                  <h3 className="font-bold text-body text-slate-900 dark:text-white truncate text-base">{inv.project?.title}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    <p className="text-smaller text-slate-500">Trạng thái: <span className="font-bold text-primary">{inv.status}</span></p>
                    <p className="text-smaller text-slate-500">Tiến độ: <span className="font-bold text-primary">{inv.project?.fundingProgress}%</span></p>
                  </div>
                </div>
                <div className="flex">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Đã đầu tư</p>
                  <p className="text-h5 font-extrabold text-primary">{formatVnd(Number(inv.amount))}</p>
                </div>
              </div>

            </div>

            <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800/50 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Link href={`/projects/${inv.project?.id}`} className="text-smaller font-bold text-slate-500 hover:text-primary transition-colors flex items-center gap-1">
                  <Eye className="text-[18px]" />
                  Xem chi tiết
                </Link>
                <button
                  onClick={() => setDisputingId(inv.project?.id || null)}
                  className="text-smaller font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                >
                   <TriangleAlert className="text-[18px]" />
                   Khiếu nại
                </button>
              </div>

              {disputingId === inv.project?.id && (
                <div className="w-full mt-4 bg-red-50 dark:bg-red-900/10 rounded-xl p-4 border border-red-100 dark:border-red-900/20">
                  <p className="text-smaller font-bold text-red-700 dark:text-red-400 mb-3">Khiếu nại dự án</p>
                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Mô tả lý do khiếu nại của bạn..."
                    className="w-full bg-white dark:bg-slate-950 border border-red-200 dark:border-red-900/30 rounded-xl p-3 text-smaller outline-none h-24 mb-3 focus:border-red-500 transition-all"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setDisputingId(null)} className="px-4 py-2 text-smaller font-bold text-slate-500 hover:text-slate-700 transition">Hủy</button>
                    <button onClick={() => handleDispute(inv.project!.id)} className="px-4 py-2 bg-red-500 text-white text-smaller font-bold rounded-lg hover:bg-red-600 transition shadow-sm">Gửi khiếu nại</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {investments.length === 0 && (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
            <FolderClosed className="text-[60px] text-slate-200 mb-4 mx-auto" />
            <p className="text-smaller text-slate-500">Bạn chưa có khoản đầu tư nào.</p>
            <Link href="/projects" className="text-primary font-bold mt-4 inline-block hover:underline">Khám phá dự án ngay</Link>
          </div>
        )}
      </div>
    </div>
  );
}
