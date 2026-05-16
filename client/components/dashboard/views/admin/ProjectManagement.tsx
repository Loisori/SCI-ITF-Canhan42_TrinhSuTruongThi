"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  FolderKanban,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { formatVnd } from "@/lib/utils";
import { Project } from "@/types/project";

type AdminProjectListResponse = {
  items: Project[];
  page: number;
  pageSize: number;
  total: number;
};

const statusOptions = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "funding", label: "Đang gọi vốn" },
  { value: "pending_admin_review", label: "Chờ duyệt giải ngân" },
  { value: "active", label: "Đang triển khai" },
  { value: "completed", label: "Hoàn thành" },
  { value: "overdue", label: "Quá hạn" },
  { value: "failed", label: "Thất bại" },
];

const statusLabels: Record<string, string> = {
  pending: "Chờ duyệt",
  funding: "Đang gọi vốn",
  pending_admin_review: "Chờ duyệt giải ngân",
  active: "Đang triển khai",
  completed: "Hoàn thành",
  overdue: "Quá hạn",
  failed: "Thất bại",
};

const statusClasses: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  funding: "bg-blue-500/10 text-blue-600",
  pending_admin_review: "bg-indigo-500/10 text-indigo-600",
  active: "bg-emerald-500/10 text-emerald-600",
  completed: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  overdue: "bg-orange-500/10 text-orange-600",
  failed: "bg-red-500/10 text-red-600",
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as { message?: unknown };
    return typeof responseData?.message === "string"
      ? responseData.message
      : fallback;
  }

  return fallback;
}

export default function ProjectManagement() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const queryParams = useMemo(
    () => ({
      page,
      pageSize,
      status,
      search: search.trim() || undefined,
    }),
    [page, search, status],
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-project-management", queryParams],
    queryFn: async () =>
      (
        await api.get<AdminProjectListResponse>("/api/admin/projects", {
          params: queryParams,
        })
      ).data,
  });

  const projects = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const approve = async (id: number) => {
    try {
      await api.patch(`/api/admin/projects/${id}/approve`);
      toast.success("Dự án đã được duyệt.");
      refetch();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Không thể duyệt dự án."));
    }
  };

  const reject = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn từ chối dự án này?")) return;

    try {
      await api.patch(`/api/admin/projects/${id}/reject`);
      toast.success("Đã từ chối dự án.");
      refetch();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Không thể từ chối dự án."));
    }
  };

  const approveDisbursement = async (id: number) => {
    try {
      await api.patch(`/api/admin/projects/${id}/approve-disbursement`);
      toast.success("Đã duyệt giải ngân đợt 1.");
      refetch();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Không thể duyệt giải ngân."));
    }
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-100 dark:bg-slate-800 w-1/4 rounded-lg" />
        <div className="h-80 bg-slate-100 dark:bg-slate-800 rounded-5" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-h3 font-bold text-slate-900 dark:text-white">
          Quản lý dự án
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-body mt-1">
          Theo dõi toàn bộ dự án, lọc theo trạng thái và xử lý các tác vụ admin.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-5 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/50 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-slate-50/50 dark:bg-white/5">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tìm theo tên dự án, chủ dự án, email hoặc danh mục..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-smaller outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 text-smaller font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/60 dark:bg-slate-800/20 text-[11px] uppercase text-slate-400 font-bold tracking-widest border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Dự án</th>
                <th className="px-6 py-4">Chủ sở hữu</th>
                <th className="px-6 py-4">Vốn</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="text-smaller font-bold text-slate-900 dark:text-white truncate max-w-88">
                      {project.title}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {project.category?.name || "Chưa phân loại"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-smaller font-bold text-slate-700 dark:text-slate-200">
                      {project.owner?.fullName || "-"}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {project.owner?.email || "-"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-smaller font-extrabold text-primary">
                      {formatVnd(Number(project.currentAmount ?? 0))}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Mục tiêu: {formatVnd(Number(project.targetCapital ?? 0))}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold ${
                        statusClasses[project.status] ??
                        "bg-slate-500/10 text-slate-600"
                      }`}
                    >
                      {statusLabels[project.status] || project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      {project.slug && (
                        <a
                          href={`/projects/${project.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition"
                        >
                          <Eye className="size-3.5" />
                          Xem
                        </a>
                      )}
                      {project.status === "pending" && (
                        <>
                          <button
                            onClick={() => approve(project.id)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[11px] font-bold hover:bg-emerald-600 transition"
                          >
                            <Check className="size-3.5" />
                            Duyệt
                          </button>
                          <button
                            onClick={() => reject(project.id)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-[11px] font-bold hover:bg-red-50 transition"
                          >
                            <X className="size-3.5" />
                            Từ chối
                          </button>
                        </>
                      )}
                      {project.status === "pending_admin_review" && (
                        <button
                          onClick={() => approveDisbursement(project.id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[11px] font-bold hover:bg-indigo-700 transition"
                        >
                          <ShieldCheck className="size-3.5" />
                          Duyệt giải ngân
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-16 text-center text-slate-500 text-smaller"
                  >
                    <FolderKanban className="text-[56px] text-slate-200 mb-4 mx-auto" />
                    Không tìm thấy dự án phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-5 border-t border-slate-100 dark:border-slate-800/50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-slate-500 font-semibold">
            Hiển thị {projects.length} / {total} dự án
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/5"
              title="Trang trước"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="px-3 text-[11px] font-bold text-slate-600 dark:text-slate-300">
              Trang {page}/{totalPages}
            </span>
            <button
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/5"
              title="Trang sau"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
