"use client";

//services
import api from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

//types
import type { ProjectCategory } from "@/types/project";

export default function HeaderCategoryNav() {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["project-categories"],
    queryFn: async () => {
      const res = await api.get<ProjectCategory[]>("/api/project-categories");
      return res.data;
    },
    staleTime: 5 * 60_000,
  });

  if (isLoading && categories.length === 0) {
    return (
      <nav
        id="category"
        className="flex items-center gap-2 py-2 border-t border-primary/10 dark:border-white/10 overflow-x-auto"
      >
        <span className="text-[11px] text-slate-400 whitespace-nowrap">
          Đang tải danh mục…
        </span>
      </nav>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <nav
      id="category"
      className="flex justify-center items-center gap-1 md:gap-2 py-2 overflow-x-auto [scrollbar-width:thin]"
      aria-label="Danh mục dự án"
    >
      <Link
        href="/projects"
        className="text-smaller uppercase tracking-wider font-bold text-slate-500 shrink-0 mr-2 hidden sm:inline border-r border-slate-300 dark:border-slate-800 pr-2"
      >
        Khám phá
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/projects?category=${c.id}`}
          className="shrink-0 px-3 py-1.5 rounded-full text-smaller font-semibold text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary dark:hover:text-slate-100 transition-colors border border-transparent hover:border-primary/20"
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
