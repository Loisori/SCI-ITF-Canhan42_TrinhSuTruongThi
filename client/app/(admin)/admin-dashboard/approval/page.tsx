"use client";

//services
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { ArrowLeft } from "lucide-react";

//types
import { PendingProject } from "@/types/approval";

export default function AdminApprovalPage() {
  const [projects, setProjects] = useState<PendingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadPage = async () => {
      try {
        const profileResponse = await api.get("/api/auth/profile");
        if (
          (profileResponse.data.role ?? "").toString().toLowerCase() !== "admin"
        ) {
          router.push("/login");
          return;
        }

        const response = await api.get<PendingProject[]>(
          "/api/admin/projects/pending",
        );
        setProjects(response.data);
      } catch (error) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [router]);

  const handleAction = async (
    projectId: number,
    action: "approve" | "reject",
  ) => {
    setActionLoading(projectId);

    try {
      const response = await api.patch<PendingProject>(
        `/api/admin/projects/${projectId}/${action}`,
      );
      setProjects((prev) => prev.filter((item) => item.id !== projectId));
      alert(
        action === "approve"
          ? "Dự án đã được duyệt và đã hiển thị trên trang chủ."
          : "Dự án đã bị từ chối.",
      );
    } catch (error) {
      alert("Không thể thực hiện hành động. Vui lòng thử lại.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <div className="wrapper wrapper--lg py-10">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-smaller text-slate-500 dark:text-slate-400">
              Bảng điều khiển Admin
            </p>
            <h1 className="text-h3 font-bold text-slate-900 dark:text-white">
              Duyệt dự án
            </h1>
            <p className="text-body text-slate-600 dark:text-slate-400 mt-2">
              Hiển thị tất cả dự án ở trạng thái <strong>pending</strong> để
              admin duyệt hoặc từ chối.
            </p>
          </div>
          <button
            onClick={() => router.push("/admin-dashboard")}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-smaller font-semibold text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft />
            Quay lại dashboard
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-300">
                Đang tải danh sách dự án pending...
              </p>
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 text-center">
              <p className="text-slate-900 dark:text-white text-h6 font-semibold mb-2">
                Không có dự án cần duyệt
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Tất cả dự án đang chờ đã được xử lý hoặc chưa có dự án mới.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <table className="min-w-full text-left divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-950">
                  <tr>
                    <th className="px-6 py-4 text-small font-semibold text-slate-600 dark:text-slate-300">
                      Dự án
                    </th>
                    <th className="px-6 py-4 text-small font-semibold text-slate-600 dark:text-slate-300">
                      Chủ dự án
                    </th>
                    <th className="px-6 py-4 text-small font-semibold text-slate-600 dark:text-slate-300">
                      Mục tiêu
                    </th>
                    <th className="px-6 py-4 text-small font-semibold text-slate-600 dark:text-slate-300">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-4 text-small font-semibold text-slate-600 dark:text-slate-300">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {projects.map((project) => (
                    <tr key={project.id}>
                      <td className="px-6 py-4">
                        <div className="text-small font-semibold text-slate-900 dark:text-white">
                          {project.title}
                        </div>
                        <div className="text-smaller text-slate-500 dark:text-slate-400">
                          {project.shortDescription ?? "Không có mô tả ngắn"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-small font-semibold text-slate-900 dark:text-white">
                          {project.owner?.fullName ?? "Không xác định"}
                        </div>
                        <div className="text-smaller text-slate-500 dark:text-slate-400">
                          {project.owner?.email ?? "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-smaller text-slate-700 dark:text-slate-300">
                        {project.targetCapital.toLocaleString("vi-VN")} đ
                      </td>
                      <td className="px-6 py-4 text-smaller text-slate-700 dark:text-slate-300">
                        {new Date(project.createdAt).toLocaleDateString(
                          "vi-VN",
                        )}
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        <button
                          disabled={actionLoading === project.id}
                          onClick={() => handleAction(project.id, "approve")}
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-500 disabled:bg-slate-300"
                        >
                          Duyệt
                        </button>
                        <button
                          disabled={actionLoading === project.id}
                          onClick={() => handleAction(project.id, "reject")}
                          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-500 disabled:bg-slate-300"
                        >
                          Từ chối
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
