"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight, Calendar, Newspaper, Search } from "lucide-react";
import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";
import api from "@/lib/axios";
import { BlogListResponse } from "@/types/blog";

export default function BlogListingPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setQuery(search.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["blogs", query],
    queryFn: async () =>
      (
        await api.get<BlogListResponse>("/api/blogs", {
          params: { search: query || undefined, pageSize: 12 },
        })
      ).data,
  });

  const posts = data?.items ?? [];

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />
      <main>
        <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="wrapper wrapper--lg">
            <div className="">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-smallest font-bold uppercase tracking-wide text-primary">
                <Newspaper className="size-4" />
                InvestPro Blog
              </span>
              <h1 className="text-h3 font-semibold text-slate-950 dark:text-white mt-4">
                Investment insights, risk thinking, and milestone strategy
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-3">
                Read practical notes from the InvestPro team on transparent
                funding, project scoring, and investor protection.
              </p>
            </div>

            <div className="relative mt-8 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search blogs..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent py-2.5 pl-10 pr-3 text-small outline-none focus:ring-1 ring-primary"
              />
            </div>
          </div>
        </section>

        <section className="wrapper wrapper--lg py-12">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-80 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
                />
              ))}
            </div>
          ) : posts.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blogs/${post.slug}`}
                  className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:border-primary/50 transition"
                >
                  <div className="aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    {post.thumbnailUrl ? (
                      <img
                        src={post.thumbnailUrl}
                        alt={post.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Newspaper className="size-12 text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      <span>{post.category}</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3" />
                        {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <h2 className="text-h6 font-black text-slate-950 dark:text-white mt-3 line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-smaller text-slate-600 dark:text-slate-400 mt-3 line-clamp-3">
                      {post.excerpt || "Read the latest InvestPro insight."}
                    </p>
                    <span className="inline-flex items-center gap-2 text-primary font-bold text-smaller mt-5">
                      Read article
                      <ArrowRight className="size-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center text-slate-500">
              No published blog posts found.
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
