"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { formatVnd } from "@/lib/utils";
import { Project, ProjectDetail } from "@/types/project";
import toast from "react-hot-toast";
import { Check, X, ShieldCheck } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import rehypeSanitize from "rehype-sanitize";

type AdminApprovalProject = Project & {
  goalAmount?: number | string;
  createdAt?: string;
};

type AdminProjectDetail = ProjectDetail & {
  contentSlug?: string;
  riskLevel?: "low" | "medium" | "high" | string;
  startDate?: string | null;
  allowOverfunding?: boolean;
  images?: string[];
  milestones?: Array<
    NonNullable<ProjectDetail["milestones"]>[number] & { intervalDays?: number }
  >;
};

export default function ProjectApprovals() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );

  const {
    data: pendingProjects = [],
    refetch: refetchPending,
    isLoading: loadingPending,
  } = useQuery({
    queryKey: ["admin-pending-projects"],
    queryFn: async () =>
      (await api.get<Project[]>("/api/admin/projects/pending")).data,
  });

  const {
    data: fundedReview = [],
    refetch: refetchFunded,
    isLoading: loadingFunded,
  } = useQuery({
    queryKey: ["admin-funded-review"],
    queryFn: async () =>
      (await api.get<Project[]>("/api/admin/projects/funding-review")).data,
  });

  const { data: selectedProject, isLoading: loadingProjectDetail } = useQuery({
    queryKey: ["admin-project-detail", selectedProjectId],
    queryFn: async () => {
      const res = await api.get<AdminProjectDetail>(
        `/api/projects/${selectedProjectId}`,
      );
      return res.data;
    },
    enabled: !!selectedProjectId,
  });

  const approve = async (id: number) => {
    try {
      await api.patch(`/api/admin/projects/${id}/approve`);
      toast.success("Dự án đã được duyệt thành công.");
      refetchPending();
    } catch {
      toast.error("Không thể duyệt dự án này.");
    }
  };

  const approveDisbursement = async (id: number) => {
    try {
      await api.patch(`/api/admin/projects/${id}/approve-disbursement`);
      toast.success("Đã duyệt và giải ngân đợt 1 thành công.");
      refetchFunded();
    } catch {
      toast.error("Không thể duyệt giải ngân đợt 1.");
    }
  };

  const reject = async (id: number) => {
    try {
      await api.patch(`/api/admin/projects/${id}/reject`);
      toast.success("Đã từ chối dự án.");
      refetchPending();
    } catch {
      toast.error("Không thể từ chối dự án này.");
    }
  };

  if (loadingPending || loadingFunded)
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-100 dark:bg-slate-800 w-1/4 rounded-lg" />
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-5" />
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-h3 font-bold text-slate-900 dark:text-white">
          Duyệt dự án
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-body mt-1">
          Quản lý và phê duyệt các yêu cầu huy động vốn mới.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-5 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Dự án mới chờ duyệt
          </h2>
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
              {pendingProjects.map((p: AdminApprovalProject) => (
                <tr
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <p className="text-smaller font-bold text-slate-900 dark:text-white truncate max-w-[20rem]">
                      {p.title}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 italic">
                      Tạo ngày:{" "}
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleDateString("vi-VN")
                        : "-"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[11px] font-bold uppercase">
                        {p.owner?.fullName?.charAt(0)}
                      </div>
                      <p className="text-smaller font-bold text-slate-700 dark:text-slate-200">
                        {p.owner?.fullName}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-smaller font-extrabold text-primary">
                      {formatVnd(Number(p.goalAmount))}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          approve(p.id);
                        }}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-[11px] font-bold hover:shadow-lg transition-all"
                      >
                        <Check className="text-small" />
                        Duyệt
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          reject(p.id);
                        }}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-red-200 text-red-500 text-[11px] font-bold hover:bg-red-50 transition-all"
                      >
                        <X className="text-small" />
                        Từ chối
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingProjects.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-slate-500 text-smaller"
                  >
                    <ShieldCheck className="text-h1 text-slate-200 mb-4 scale-150 mx-auto" />
                    <p className="mt-4">Không có dự án nào chờ duyệt.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Section 2: Funded Projects Awaiting 1st Disbursement */}
      <div className="bg-white dark:bg-slate-900 rounded-5 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-indigo-50/30 dark:bg-indigo-900/10">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="size-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Dự án đã đủ vốn - Chờ duyệt giải ngân đợt 1
          </h2>
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 text-[11px] font-bold uppercase tracking-widest">
            {fundedReview.length} Review
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 dark:bg-slate-800/20 text-[11px] uppercase text-slate-400 font-bold tracking-widest border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Dự án</th>
                <th className="px-6 py-4">Chủ dự án</th>
                <th className="px-6 py-4">Vốn đạt được</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {fundedReview.map((p: AdminApprovalProject) => (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <p className="text-smaller font-bold text-slate-900 dark:text-white">
                      {p.title}
                    </p>
                    <p className="text-[10px] text-indigo-500 font-semibold mt-1">
                      Hoàn thành gọi vốn: {p.fundingProgress}%
                    </p>
                  </td>
                  <td className="px-6 py-4 text-smaller font-medium text-slate-600 dark:text-slate-400">
                    {p.owner?.fullName}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-smaller font-extrabold text-emerald-600">
                      {formatVnd(Number(p.currentAmount))}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => approveDisbursement(p.id)}
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-[11px] font-bold hover:bg-indigo-700 transition-all shadow-sm"
                    >
                      Duyệt & Giải ngân đợt 1
                    </button>
                  </td>
                </tr>
              ))}
              {fundedReview.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-slate-500 text-smaller italic"
                  >
                    Chưa có dự án nào hoàn thành gọi vốn chờ duyệt.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedProjectId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Chi tiết dự án chờ duyệt
              </h3>
              <button
                onClick={() => setSelectedProjectId(null)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="size-5" />
              </button>
            </div>

            {loadingProjectDetail ? (
              <div className="p-6 text-slate-500">
                Đang tải chi tiết dự án...
              </div>
            ) : selectedProject ? (
              <div className="p-6 space-y-6">
                {(() => {
                  const milestonesWithInterval = (selectedProject.milestones ??
                    []) as Array<
                    NonNullable<ProjectDetail["milestones"]>[number] & {
                      intervalDays?: number;
                    }
                  >;

                  return (
                    <>
                      <div>
                        <h4 className="text-h4 font-bold text-slate-900 dark:text-white">
                          {selectedProject.title}
                        </h4>
                        <p className="text-slate-500 text-sm mt-1">
                          Trạng thái: {selectedProject.status}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                            Chủ dự án
                          </p>
                          <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">
                            {selectedProject.owner?.fullName || "-"}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                            Danh mục
                          </p>
                          <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">
                            {selectedProject.category?.name || "-"}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                            Mục tiêu vốn
                          </p>
                          <p className="mt-1 font-semibold text-primary">
                            {formatVnd(
                              Number(selectedProject.targetCapital || 0),
                            )}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                            Tối thiểu đầu tư
                          </p>
                          <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">
                            {formatVnd(
                              Number(selectedProject.minInvestment || 0),
                            )}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                            Lãi suất / kỳ hạn
                          </p>
                          <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">
                            {selectedProject.interestRate}% /{" "}
                            {selectedProject.durationMonths} tháng
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                            Địa chỉ
                          </p>
                          <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">
                            {selectedProject.address || "-"}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                            Mức độ rủi ro
                          </p>
                          <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100 uppercase">
                            {selectedProject.riskLevel || "-"}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                            Overfunding
                          </p>
                          <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">
                            {selectedProject.allowOverfunding ? "Bật" : "Tắt"}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                            Ngày bắt đầu
                          </p>
                          <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">
                            {selectedProject.startDate
                              ? new Date(
                                  selectedProject.startDate,
                                ).toLocaleDateString("vi-VN")
                              : "-"}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                            Deadline
                          </p>
                          <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">
                            {selectedProject.endDate
                              ? new Date(
                                  selectedProject.endDate,
                                ).toLocaleDateString("vi-VN")
                              : "-"}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 md:col-span-2">
                          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                            Slug
                          </p>
                          <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100 break-all">
                            {selectedProject.contentSlug || "-"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-2">
                          Ảnh bìa chính
                        </p>
                        {selectedProject.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={selectedProject.thumbnailUrl}
                            alt={selectedProject.title}
                            className="w-full max-h-80 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <p className="text-slate-500">Không có ảnh bìa.</p>
                        )}
                      </div>

                      <div>
                        <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-2">
                          Gallery ảnh phụ
                        </p>
                        {selectedProject.images &&
                        selectedProject.images.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {selectedProject.images.map((imageUrl, index) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={`${imageUrl}-${index}`}
                                src={imageUrl}
                                alt={`gallery-${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500">Không có ảnh phụ.</p>
                        )}
                      </div>

                      <div>
                        <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-2">
                          Mô tả ngắn
                        </p>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {selectedProject.shortDescription ||
                            "Không có mô tả ngắn."}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-2">
                          Nội dung chi tiết
                        </p>
                        <div
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950/40"
                          data-color-mode="light"
                        >
                          {selectedProject.content ? (
                            <MDEditor.Markdown
                              source={selectedProject.content}
                              rehypePlugins={[[rehypeSanitize]]}
                            />
                          ) : (
                            <p className="text-slate-500">
                              Không có nội dung chi tiết.
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-2">
                          Milestones giải ngân
                        </p>
                        {milestonesWithInterval.length > 0 ? (
                          <div className="space-y-3">
                            {milestonesWithInterval
                              .slice()
                              .sort((a, b) => a.stage - b.stage)
                              .map((milestone) => (
                                <div
                                  key={milestone.id}
                                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="font-bold text-slate-900 dark:text-white">
                                      Đợt {milestone.stage}: {milestone.title}
                                    </p>
                                    <span className="text-primary font-extrabold text-smaller">
                                      {milestone.percentage}%
                                    </span>
                                  </div>
                                  <div
                                    className="mt-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-3"
                                    data-color-mode="light"
                                  >
                                    {milestone.content ? (
                                      <MDEditor.Markdown
                                        source={milestone.content}
                                        rehypePlugins={[[rehypeSanitize]]}
                                      />
                                    ) : (
                                      <p className="text-smaller text-slate-600 dark:text-slate-300">
                                        Không có mô tả.
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-4 mt-3 text-[11px] text-slate-500 font-semibold uppercase tracking-wide">
                                    <span>Trạng thái: {milestone.status}</span>
                                    <span>
                                      Chờ: {milestone.intervalDays ?? 0} ngày
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p className="text-slate-500">Không có milestones.</p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="p-6 text-red-500">
                Không thể tải chi tiết dự án.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
