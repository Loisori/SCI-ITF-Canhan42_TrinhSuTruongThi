"use client";

import Footer from "@/components/client/Footer";
import Navbar from "@/components/client/Navbar";
import ProjectCard from "@/components/client/ProjectCard";
import api from "@/lib/axios";
import { Project, ProjectCategory } from "@/types/project";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";

function ProjectCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-pulse">
      <div className="w-full aspect-16/10 bg-slate-200 dark:bg-slate-800" />
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
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());

  const [searchValue, setSearchValue] = useState(searchFromUrl);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTimestamp(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

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
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                nowTimestamp={nowTimestamp}
              />
            ))}
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
