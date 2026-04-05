"use client";

//services
import { useEffect, useState } from "react";
import api from "@/lib/axios";

//types
import { ProjectDetail } from "@/types/project";
// import Sidebar from "@/components/admin/Sidebar";

export default function AdminDisputesPage() {
  const [projects, setProjects] = useState<ProjectDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/projects/disputes");
      setProjects(res.data);
    } catch {
      setError("Không thể lấy danh sách tranh chấp.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDisputes();
  }, []);

  const handleResolve = async (projectId: number, action: 'dismiss' | 'refund') => {
    if (!confirm(action === 'dismiss' ? "Bạn có chắc chắn muốn bỏ qua khiếu nại và cho dự án tiếp tục?" : "Bạn có chắc muốn HOÀN TIỀN? Hành động này không thể hoàn tác!")) {
      return;
    }
    
    try {
      await api.post(`/api/admin/projects/${projectId}/disputes/resolve`, { action });
      alert("Xử lý thành công!");
      fetchDisputes();
    } catch (err: any) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      {/* <Sidebar /> */}
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-h4 font-black">Xử lý Tranh Chấp</h1>
          <p className="text-slate-500">Các dự án bị đình chỉ do có 50% nhà đầu tư khiếu nại.</p>
        </div>

        {loading ? (
          <div>Đang tải...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500">
            Không có dự án nào đang bị tranh chấp.
          </div>
        ) : (
          <div className="space-y-6">
            {projects.map(project => (
              <div key={project.id} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="font-bold text-h6">{project.title}</h2>
                    <p className="text-small text-slate-500">ID Dự án: {project.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleResolve(project.id, 'dismiss')}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
                    >
                      Bỏ qua khiếu nại (Dismiss)
                    </button>
                    <button 
                      onClick={() => handleResolve(project.id, 'refund')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
                    >
                      Hoàn tiền gốc (Refund)
                    </button>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-4">
                  <h3 className="font-bold text-red-800 mb-2">Danh sách Khiếu nại ({project.disputes?.length || 0})</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {project.disputes?.filter((d: any) => d.status === 'open').map((d: any) => (
                      <div key={d.id} className="bg-white p-3 rounded border text-small">
                        <strong>User ID {d.userId}:</strong> {d.reason}
                        {d.evidenceUrl && (
                           <a href={d.evidenceUrl} target="_blank" className="ml-2 text-primary underline">Xem ảnh</a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
