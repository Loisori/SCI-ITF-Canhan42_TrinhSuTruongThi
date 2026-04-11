"use client";

import Footer from "@/components/client/Footer";
import Navbar from "@/components/client/Navbar";
import api from "@/lib/axios";
import { Project, ProjectCategory } from "@/types/project";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";

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

function ProjectListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchFromUrl = searchParams.get("search") ?? "";
  const categoryFromUrl = searchParams.get("category") ?? "";

  const [searchValue, setSearchValue] = useState(searchFromUrl);

  useEffect(() => {
    setSearchValue(searchFromUrl);
  }, [searchFromUrl]);

  const { data: categories = [] } = useQuery({
    queryKey: ["project-categories"],
    queryFn: async () => {
      const res = await api.get<ProjectCategory[]>("/api/project-categories");
      return res.data;
    },
    staleTime: 5 * 60_000,
  });

  const projectsQueryKey = useMemo(
    () => ["funding-projects", searchFromUrl, categoryFromUrl] as const,
    [searchFromUrl, categoryFromUrl],
  );

  const {
    data: projects = [],
    isLoading: loading,
    error,
    isError,
  } = useQuery({
    queryKey: projectsQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchFromUrl.trim()) params.set("search", searchFromUrl.trim());
      if (categoryFromUrl) params.set("category", categoryFromUrl);
      const qs = params.toString();
      const url = qs ? `/api/projects?${qs}` : "/api/projects";
      const res = await api.get<Project[]>(url);
      return res.data;
    },
  });



  const pushProjectsUrl = (next: { search?: string; category?: string }) => {
    const params = new URLSearchParams();
    const s = next.search?.trim() ?? "";
    const c = next.category ?? "";
    if (s) params.set("search", s);
    if (c) params.set("category", c);
    const qs = params.toString();
    router.push(qs ? `/projects?${qs}` : "/projects");
  };

  const applySearch = () => {
    pushProjectsUrl({
      search: searchValue,
      category: categoryFromUrl || undefined,
    });
  };

  const setCategoryFilter = (categoryId: string | null) => {
    pushProjectsUrl({
      search: searchFromUrl,
      category: categoryId ?? undefined,
    });
  };

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
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex w-full items-stretch rounded-xl h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="text-slate-400 flex items-center justify-center pl-5">
              <Search />
            </div>
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              placeholder="Tìm theo tên dự án, chủ dự án hoặc danh mục..."
              className="flex-1 px-4 text-base focus:outline-none bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={applySearch}
              className="bg-primary text-white px-6 font-bold m-1.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Tìm kiếm
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider mr-2">
              <Filter className="text-lg" />
              Lọc:
            </div>
            <button
              type="button"
              onClick={() => setCategoryFilter(null)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !categoryFromUrl
                  ? "bg-primary text-white"
                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary text-slate-700 dark:text-slate-300"
              }`}
            >
              Tất cả
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryFilter(String(c.id))}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  categoryFromUrl === String(c.id)
                    ? "bg-primary text-white"
                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary text-slate-700 dark:text-slate-300"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <ProjectCardSkeleton key={index} />
            ))}
          </div>
        ) : null}

        {isError ? (
          <div className=" text-red-500">
            {error instanceof Error
              ? error.message
              : "Không thể tải danh sách dự án."}
          </div>
        ) : null}

        {!loading && !isError ? (
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
              const href = `/projects/${project.contentSlug ?? project.id}`;

              return (
                <Link
                  key={project.id}
                  href={href}
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
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-smallest">
                        Không có ảnh
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-h6 font-bold text-slate-900 dark:text-white leading-tight mb-2">
                      {project.title}
                    </h3>

                    {project.category?.name ? (
                      <p className="text-[11px] uppercase tracking-wider font-bold text-primary mb-2">
                        {project.category.name}
                      </p>
                    ) : null}

                    {project.owner?.fullName ? (
                      <p className="text-[11px] text-slate-500 mb-2">
                        Chủ dự án: {project.owner.fullName}
                      </p>
                    ) : null}

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
                      {overProgress > 0 ? (
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
                      ) : null}
                    </div>

                    <div className="mt-auto w-full py-3 bg-primary text-white font-bold rounded-lg text-center">
                      Xem chi tiết
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : null}

        {!loading && !isError && projects.length === 0 ? (
          <p className="text-slate-500 text-body py-8 text-center">
            Không có dự án phù hợp. Thử bỏ bộ lọc hoặc từ khóa khác.
          </p>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}

function ProjectListFallback() {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />
      <main className="wrapper wrapper--lg py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <ProjectCardSkeleton key={index} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ProjectListPage() {
  return (
    <Suspense fallback={<ProjectListFallback />}>
      <ProjectListInner />
    </Suspense>
  );
}
