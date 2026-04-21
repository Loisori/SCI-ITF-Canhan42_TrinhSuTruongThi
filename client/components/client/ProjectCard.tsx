"use client";

import Link from "next/link";
import { Timer, MapPin } from "lucide-react";
import type { Project } from "@/types/project";
import { useState, useEffect } from "react";

interface ProjectCardProps {
  project: Project;
  nowTimestamp?: number;
}

export function formatTimeRemaining(
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

export default function ProjectCard({
  project,
  nowTimestamp: externalNow,
}: ProjectCardProps) {
  const [internalNow, setInternalNow] = useState(() => Date.now());
  const now = externalNow ?? internalNow;

  useEffect(() => {
    if (externalNow) return;
    const id = window.setInterval(() => {
      setInternalNow(Date.now());
    }, 60_000);
    return () => window.clearInterval(id);
  }, [externalNow]);

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
  const timeLeft = formatTimeRemaining(project.endDate, now);
  const ownerName = project.owner?.fullName?.trim() || "Chủ dự án";
  const ownerInitial = ownerName.charAt(0).toUpperCase();
  const categoryLabel = project.category?.name || "Chưa phân loại";
  const href = `/projects/${project.slug || project.id}`;

  return (
    <div className="group relative dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 transition-all hover:shadow-2xl h-full flex flex-col">
      {/* Absolute Link for the whole card area (except owner info) */}
      <Link
        href={href}
        className="absolute inset-0 z-0"
        aria-label={`Xem dự án ${project.title}`}
      />

      <div className="relative aspect-16/10 overflow-hidden bg-slate-200 dark:bg-slate-800 z-10 pointer-events-none rounded-t-3">
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
        <span className="absolute top-4 right-4 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase z-10">
          {project.status === "funding" ? "Đang gọi vốn" : project.status}
        </span>
      </div>

      <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-b-xl overflow-hidden">
        <div
          className="bg-green-500 h-full rounded-full transition-[width] duration-500"
          style={{ width: `${bar}%` }}
        />
      </div>

      <div className="flex gap-2 p-5 pt-4 flex-1">
        <div className="flex flex-col items-center shrink-0 z-20">
          <Link
            href={`/profile/${project.owner?.slug}`}
            className="hover:opacity-80 transition-opacity"
          >
            {project.owner?.avatarUrl ? (
              <img
                src={project.owner.avatarUrl}
                alt={ownerName}
                className="size-11 rounded-full object-cover border border-slate-200 dark:border-slate-700 mb-2"
              />
            ) : (
              <div className="size-11 rounded-full bg-primary/10 text-primary dark:text-slate-100 border border-primary/20 flex items-center justify-center text-[11px] font-bold mb-2">
                {ownerInitial}
              </div>
            )}
          </Link>
          <Timer className="size-4 text-slate-400" />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <h4 className="text-h6 font-semibold text-[#282828] dark:text-white line-clamp-2 leading-tight mb-2 group-hover:text-primary transition-colors">
            {project.title}
          </h4>
          <div className="flex items-center gap-2 z-20">
            <Link
              href={`/profile/${project.owner?.slug}`}
              className="text-smallest font-bold text-[#656969] dark:text-slate-200 truncate hover:text-primary transition-colors"
            >
              {ownerName}
            </Link>
          </div>
          <div className="flex items-center gap-1.5 text-smaller font-bold text-[#4D4D4D] dark:text-slate-200">
            <span className="whitespace-nowrap">{timeLeft}</span>
            <span className="text-slate-300">•</span>
            <span className="text-primary">{progress}% đã đầu tư</span>
          </div>
          <div className="hidden group-hover:block">
            {project.shortDescription ? (
              <p className="mb-3 text-small text-slate-500 dark:text-slate-400 line-clamp-2">
                {project.shortDescription}
              </p>
            ) : null}
            <div className="flex gap-2 text-smaller">
              {project.category && (
                <span className="border rounded-full py-[.7rem] px-[1.1rem]">
                  {categoryLabel}
                </span>
              )}
              {project.address && (
                <span className="border rounded-full py-[.7rem] px-[1.1rem]">
                  {project.address}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
