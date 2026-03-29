"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";
import api from "@/lib/axios";
import { Project, ProjectCategory } from "@/types/project";
import { Profile } from "@/types/user";

function ProjectCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-pulse">
      <div className="w-full aspect-[16/10] bg-slate-200 dark:bg-slate-800" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-4/5" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/5" />
      </div>
    </div>
  );
}

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get<Project[]>("/api/projects");
        setProjects(res.data);
      } catch {
        setError("Không thể tải danh sách dự án.");
      } finally {
        setLoading(false);
      }
    };

    const fetchProfile = async () => {
      try {
        const res = await api.get<Profile>("/auth/profile");
        setRole(res.data.role);
      } catch {
        setRole(null);
      }
    };

    void fetchProjects();
    void fetchProfile();
  }, []);

  const ownerMode = useMemo(() => role === "owner", [role]);

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />

      <main className="wrapper wrapper--lg py-10">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-h3 md:text-h3 font-black text-slate-900 dark:text-white tracking-tight">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <ProjectCardSkeleton key={index} />
            ))}
          </div>
        )}

        {error && <div className="text-red-500">{error}</div>}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => {
              const progress =
                Number(project.fundingProgress) ||
                (Number(project.targetCapital) > 0
                  ? Number(
                      (
                        (Number(project.currentCapital) /
                          Number(project.targetCapital)) *
                        100
                      ).toFixed(2),
                    )
                  : 0);
              const baseProgress = Math.min(progress, 100);
              const overProgress = Math.max(progress - 100, 0);

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
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
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-h6 font-bold text-slate-900 dark:text-white leading-tight mb-2">
                      {project.title}
                    </h3>

                    {project.category?.name && (
                      <p className="text-[11px] uppercase tracking-wider font-bold text-primary mb-2">
                        {project.category.name}
                      </p>
                    )}

                    <p className="text-smaller text-slate-500 dark:text-slate-400 mb-5 line-clamp-2">
                      {project.shortDescription ||
                        "Dự án đang cập nhật mô tả chi tiết."}
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
                        <span className="text-slate-600 dark:text-slate-400">
                          Tiến độ huy động
                        </span>
                        <span className="font-bold text-primary dark:text-white">
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full"
                          style={{ width: `${baseProgress}%` }}
                        />
                      </div>
                      {overProgress > 0 && (
                        <div className="mt-1.5">
                          <div className="w-full bg-orange-100 dark:bg-orange-900/30 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-orange-500 h-full"
                              style={{
                                width: `${Math.min(overProgress, 100)}%`,
                              }}
                            />
                          </div>
                          <p className="mt-1 text-[11px] font-semibold text-orange-600 dark:text-orange-300">
                            Vượt mục tiêu +{overProgress.toFixed(2)}%
                          </p>
                        </div>
                      )}
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
