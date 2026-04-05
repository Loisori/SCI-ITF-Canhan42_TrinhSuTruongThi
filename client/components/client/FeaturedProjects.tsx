"use client";

//services
import api from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import { useMemo } from "react";

//types
import type { Project } from "@/types/project";

function projectHref(p: Project) {
  return `/projects/${p.contentSlug ?? p.id}`;
}

export default function FeaturedProjects() {
  const autoplay = useMemo(
    () =>
      Autoplay({
        delay: 4500,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    [],
  );

  const [emblaRef] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      dragFree: false,
    },
    [autoplay],
  );

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["featured-funding-projects"],
    queryFn: async () => {
      const res = await api.get<Project[]>("/api/projects");
      return res.data;
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <section className="py-24 max-w-screen-xl mx-auto px-4 font-display">
        <div className="flex items-end justify-between mb-10">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="h-96 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
      </section>
    );
  }

  if (projects.length === 0) {
    return (
      <section className="py-24 max-w-screen-xl mx-auto px-4 font-display">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h3 className="text-h4 font-black text-primary dark:text-slate-100">
              Dự án nổi bật
            </h3>
            <p className="text-slate-500 mt-2">
              Hiện chưa có dự án đang huy động vốn. Quay lại sau nhé.
            </p>
          </div>
          <Link
            href="/projects"
            className="hidden md:flex items-center gap-2 text-primary dark:text-slate-100 font-bold"
          >
            Xem tất cả dự án
            <span className="material-symbols-outlined">arrow_right_alt</span>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="font-display">
      <div className="wrapper wrapper--lg flex items-end justify-between mb-10">
        <div>
          <h3 className="text-h4 font-black text-primary dark:text-slate-100">
            Dự án nổi bật
          </h3>
          <p className="text-slate-500 mt-2">
            Các dự án đang gọi vốn — dữ liệu cập nhật trực tiếp từ nền tảng.
          </p>
        </div>
        <Link
          href="/projects"
          className="hidden md:flex items-center gap-2 text-primary dark:text-slate-100 font-bold"
        >
          Xem tất cả dự án
          <span className="material-symbols-outlined">arrow_right_alt</span>
        </Link>
      </div>

      <div className="wrapper wrapper--lg overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-3">
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
            const bar = Math.min(progress, 100);

            return (
              <div
                key={project.id}
                className="min-w-0 flex-[0_0_100%] pl-3 sm:flex-[0_0_92%] md:flex-[0_0_48%] lg:flex-[0_0_32%]"
              >
                <div className="group bg-white dark:bg-white/5 rounded-2xl overflow-hidden border border-slate-100 dark:border-white/10 transition-all hover:shadow-2xl h-full flex flex-col">
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-200 dark:bg-slate-800">
                    {project.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={project.thumbnailUrl}
                        alt={project.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-smaller">
                        Không có ảnh
                      </div>
                    )}
                    <span className="absolute top-4 right-4 bg-green-500 text-white text-smallest font-bold px-3 py-1 rounded-full uppercase z-10">
                      Đang gọi vốn
                    </span>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    {project.category?.name ? (
                      <p className="text-[11px] uppercase tracking-wider font-bold text-primary mb-1">
                        {project.category.name}
                      </p>
                    ) : null}
                    <h4 className="text-h6 font-bold mb-2 text-slate-900 dark:text-white line-clamp-2">
                      {project.title}
                    </h4>
                    <p className="text-smaller text-slate-500 dark:text-slate-400 mb-5 line-clamp-2 flex-1">
                      {project.shortDescription ||
                        "Khám phá chi tiết dự án và cơ hội đầu tư."}
                    </p>
                    <div className="space-y-2 mt-auto">
                      <div className="flex justify-between text-smaller font-bold text-slate-700 dark:text-slate-200">
                        <span>Tiến độ</span>
                        <span className="text-primary dark:text-slate-100">
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-[width] duration-500"
                          style={{ width: `${bar}%` }}
                        />
                      </div>
                    </div>
                    <Link
                      href={projectHref(project)}
                      className="mt-6 block w-full py-3 text-center border-2 border-primary text-primary dark:border-slate-100 dark:text-slate-100 font-bold rounded-xl hover:bg-primary hover:text-white dark:hover:bg-slate-100 dark:hover:text-primary transition-all"
                    >
                      Đầu tư
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
