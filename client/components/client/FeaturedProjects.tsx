"use client";

//services
import api from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Timer } from "lucide-react";

//types
import type { Project } from "@/types/project";

function formatTimeRemaining(
  endDate: string | null | undefined,
  nowTimestamp: number,
): string {
  if (!endDate) {
    return "Không giới hạn";
  }

  const deadline = new Date(endDate);
  if (Number.isNaN(deadline.getTime())) {
    return "Không rõ hạn";
  }

  const diff = deadline.getTime() - nowTimestamp;
  if (diff <= 0) {
    return "Đã kết thúc";
  }

  const totalMinutes = Math.floor(diff / (1000 * 60));
  if (totalMinutes < 60) {
    return `Còn ${Math.max(1, totalMinutes)} phút`;
  }

  const totalHours = Math.floor(totalMinutes / 60);
  if (totalHours < 24) {
    const minutes = totalMinutes % 60;
    return `Còn ${totalHours} giờ ${minutes} phút`;
  }

  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days < 30) {
    return `Còn ${days} ngày ${hours} giờ`;
  }

  const months = Math.floor(days / 30);
  const remainDays = days % 30;
  return `Còn ${months} tháng ${remainDays} ngày`;
}

function projectHref(p: Project) {
  return `/projects/${p.contentSlug ?? p.id}`;
}

export default function FeaturedProjects() {
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());

  const autoplay = useMemo(
    () =>
      Autoplay({
        delay: 4500,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    [],
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setNowTimestamp(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(id);
    };
  }, []);

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
            <ArrowRight />
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
          <ArrowRight />
        </Link>
      </div>

      <div className="wrapper wrapper--lg overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-3">
          {projects.map((project) => {
            const serverProgress = Number(project.fundingProgress);
            const currentCapital = Number(
              project.currentCapital ?? project.currentAmount ?? 0,
            );
            const targetCapital = Number(project.targetCapital ?? 0);

            const fallbackProgress =
              targetCapital > 0
                ? Number(((currentCapital / targetCapital) * 100).toFixed(2))
                : 0;

            const progress = Number.isFinite(serverProgress)
              ? serverProgress
              : fallbackProgress;
            const bar = Math.max(
              0,
              Math.min(Number.isFinite(progress) ? progress : 0, 100),
            );
            const timeLeft = formatTimeRemaining(project.endDate, nowTimestamp);
            const ownerName = project.owner?.fullName?.trim() || "Chủ dự án";
            const ownerInitial = ownerName.charAt(0).toUpperCase();

            return (
              <div
                key={project.id}
                className="min-w-0 flex-[0_0_100%] pl-3 sm:flex-[0_0_92%] md:flex-[0_0_48%] lg:flex-[0_0_32%]"
              >
                <Link
                  href={projectHref(project)}
                  className="group dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 transition-all hover:shadow-2xl h-full flex flex-col"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-200 dark:bg-slate-800">
                    {project.thumbnailUrl ? (
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
                  <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-b-full overflow-hidden">
                    <div
                      className="bg-green-500 h-full rounded-full transition-[width] duration-500"
                      style={{ width: `${bar}%` }}
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <div className="flex flex-col">
                      {project.owner?.avatarUrl ? (
                        <img
                          src={project.owner.avatarUrl}
                          alt={ownerName}
                          className="size-11 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="size-11 rounded-full bg-primary/10 text-primary dark:text-slate-100 border border-primary/20 flex items-center justify-center text-[11px] font-bold">
                          {ownerInitial}
                        </div>
                      )}
                      <Timer className="" />
                    </div>
                    <div className="px-2 pb-4 flex flex-col flex-1">
                      <h4 className="text-h6 font-semibold text-[#282828] dark:text-white line-clamp-3">
                        {project.title}
                      </h4>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="min-w-0">
                          <p className="text-smallest font-bold text-[#656969] dark:text-slate-200 truncate">
                            {ownerName}
                          </p>
                        </div>
                      </div>
                      {/* 
                    {project.category?.name ? (
                      <p className="text-[11px] uppercase tracking-wider font-bold text-primary mb-1">
                        {project.category.name}
                      </p>
                    ) : null}

                    <p className="text-smaller text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                      {project.shortDescription ||
                        "Khám phá chi tiết dự án và cơ hội đầu tư."}
                    </p> */}

                      <div className="space-y-2 mt-auto">
                        <div className="flex text-smaller font-bold text-[#4D4D4D] dark:text-slate-200">
                          <span>
                            {timeLeft}
                          </span>
                          <span> * </span>
                          <span>
                            {progress}% đã đầu tư
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
