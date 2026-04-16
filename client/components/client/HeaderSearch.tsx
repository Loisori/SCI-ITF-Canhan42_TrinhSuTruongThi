"use client";

//services
import api from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

//types
import type { Project } from "@/types/project";

const DEBOUNCE_MS = 320;

export default function HeaderSearch() {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(raw.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [raw]);

  const { data: suggestions = [], isFetching } = useQuery({
    queryKey: ["header-project-suggestions", debounced],
    queryFn: async () => {
      const res = await api.get<Project[]>(
        `/api/projects/suggestions?q=${encodeURIComponent(debounced)}`,
      );
      return res.data;
    },
    enabled: debounced.length >= 1,
    staleTime: 30_000,
  });

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const goSearchPage = useCallback(() => {
    const q = raw.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/projects?search=${encodeURIComponent(q)}`);
  }, [raw, router]);

  const showDropdown =
    open && debounced.length >= 1 && (suggestions.length > 0 || isFetching);

  return (
    <div
      ref={wrapRef}
      className="relative w-full max-w-full md:mx-auto"
    >
      <div className="flex items-stretch rounded-xl h-10 md:h-11 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
        <Search className="text-slate-400 pl-3 flex items-center text-h6 m-auto" />
        <input
          type="search"
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              goSearchPage();
            }
          }}
          placeholder="Tìm dự án, chủ dự án, danh mục..."
          className="flex-1 min-w-0 px-2 text-smaller bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-500"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
        />
        <button
          type="button"
          onClick={goSearchPage}
          className="px-3 md:px-4 text-smaller font-bold text-primary dark:text-slate-200 hover:bg-primary/10 shrink-0"
        >
          Tìm
        </button>
      </div>
      {showDropdown ? (
        <div className="absolute left-0 right-0 top-full mt-1 z-[60] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl max-h-80 overflow-y-auto">
          {isFetching && suggestions.length === 0 ? (
            <div className="px-4 py-3 text-smaller text-slate-500">
              Đang tìm…
            </div>
          ) : null}
          {!isFetching && suggestions.length === 0 ? (
            <div className="px-4 py-3 text-smaller text-slate-500">
              Không có kết quả. Nhấn Tìm để xem trang danh sách.
            </div>
          ) : null}
          {suggestions.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.contentSlug ?? p.id}`}
              className="flex gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-100 dark:border-slate-800 last:border-0"
              onClick={() => setOpen(false)}
            >
              {p.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.thumbnailUrl}
                  alt=""
                  className="w-14 h-10 object-cover rounded-lg shrink-0"
                />
              ) : (
                <div className="w-14 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-smaller font-bold text-slate-900 dark:text-white truncate">
                  {p.title}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {[p.owner?.fullName, p.category?.name]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </Link>
          ))}
          <button
            type="button"
            className="w-full px-3 py-2 text-smaller font-bold text-primary text-center hover:bg-primary/5 border-t border-slate-100 dark:border-slate-800"
            onClick={goSearchPage}
          >
            Xem tất cả kết quả cho &quot;{debounced}&quot;
          </button>
        </div>
      ) : null}
    </div>
  );
}
