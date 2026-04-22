"use client";

//services
import api from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import ProjectCard from "./ProjectCard";

//types
import type { Project } from "@/types/project";

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
    // [autoplay],
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
      <section className="py-24 mx-auto px-4 font-display">
        <div className="wrapper wrapper--lg flex items-end justify-between mb-10">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="h-96 rounded-5 bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
      </section>
    );
  }

  if (projects.length === 0) {
    return (
      <section className="py-24 mx-auto px-4 font-display">
        <div className="wrapper wrapper--lg flex items-end justify-between mb-10">
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

      <div className="wrapper wrapper--lg" ref={emblaRef}>
        <div className="flex -ml-3">
          {projects.map((project) => {
            return (
              <div
                key={project.id}
                className="min-w-0 flex-[0_0_100%] pl-6 sm:flex-[0_0_92%] md:flex-[0_0_48%] lg:flex-[0_0_32%]"
              >
                <ProjectCard project={project} nowTimestamp={nowTimestamp} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
