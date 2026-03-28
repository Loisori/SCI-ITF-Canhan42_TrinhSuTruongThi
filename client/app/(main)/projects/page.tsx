"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import axios from "axios";
import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";

type Project = {
  id: number;
  title: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  contentSlug: string | null;
  targetCapital: number;
  currentCapital: number;
  fundingProgress: number;
  interestRate: number;
  durationMonths: number;
  status: string;
};

type Me = {
  role: string;
};

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get<Project[]>(
          `${process.env.NEXT_PUBLIC_API_URL}/api/projects`,
        );
        setProjects(res.data);
      } catch {
        setError("Không thể tải danh sách dự án.");
      } finally {
        setLoading(false);
      }
    };

    const fetchMe = async () => {
      const token = Cookies.get("access_token");
      if (!token) {
        setRole(null);
        return;
      }

      try {
        const res = await axios.get<Me>(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRole(res.data.role);
      } catch {
        setRole(null);
      }
    };

    void fetchProjects();
    void fetchMe();
  }, []);

  const ownerMode = useMemo(() => role === "owner", [role]);

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />

      <main className="wrapper wrapper--lg py-10">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-h3 md:text-h2 font-black text-slate-900 dark:text-white tracking-tight">
              Cơ hội đầu tư tiềm năng
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-body max-w-2xl">
              Danh sách dự án đang huy động vốn công khai cho mọi người.
            </p>
          </div>

          {ownerMode && (
            <Link
              href="/projects/create"
              className="px-4 py-2 rounded-lg bg-primary text-white text-smaller font-bold whitespace-nowrap"
            >
              Tạo dự án mới
            </Link>
          )}
        </div>

        {loading && (
          <div className="text-slate-600 dark:text-slate-400">Đang tải dự án...</div>
        )}

        {error && <div className="text-red-500">{error}</div>}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => {
              const slug = project.contentSlug || String(project.id);

              return (
                <Link
                  key={project.id}
                  href={`/projects/${slug}`}
                  className="group flex flex-col bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {project.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        src={project.thumbnailUrl}
                        alt={project.title}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-smaller">
                        Không có ảnh
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-green-500 text-white text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                      Đang mở
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-h6 font-bold text-slate-900 dark:text-white leading-tight mb-3">
                      {project.title}
                    </h3>

                    <p className="text-smaller text-slate-500 dark:text-slate-400 mb-5 line-clamp-2">
                      {project.shortDescription || "Dự án đang cập nhật mô tả chi tiết."}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-y border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                          Lãi suất
                        </p>
                        <p className="text-h6 font-bold text-green-600 dark:text-green-400">
                          {Number(project.interestRate).toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                          Thời hạn
                        </p>
                        <p className="text-h6 font-bold text-slate-900 dark:text-white">
                          {project.durationMonths} tháng
                        </p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex justify-between text-smaller mb-1.5">
                        <span className="text-slate-600 dark:text-slate-400">Tiến độ huy động</span>
                        <span className="font-bold text-primary dark:text-white">
                          {project.fundingProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full"
                          style={{ width: `${Math.min(project.fundingProgress, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="mt-auto w-full py-3 bg-primary text-white font-bold rounded-lg text-center">
                      Xem chi tiết
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
