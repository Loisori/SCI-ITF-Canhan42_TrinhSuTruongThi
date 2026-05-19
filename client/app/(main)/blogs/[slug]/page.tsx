"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import rehypeSanitize from "rehype-sanitize";
import { ArrowLeft, Calendar, Newspaper } from "lucide-react";
import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";
import api from "@/lib/axios";
import { BlogPost } from "@/types/blog";

const MarkdownPreview = dynamic(() => import("@uiw/react-markdown-preview"), {
  ssr: false,
  loading: () => (
    <div className="h-96 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
  ),
});

export default function BlogDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params.slug ?? "");

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog", slug],
    enabled: Boolean(slug),
    queryFn: async () =>
      (await api.get<BlogPost>(`/api/blogs/${encodeURIComponent(slug)}`)).data,
  });

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />
      <main>
        {isLoading ? (
          <div className="wrapper wrapper--md py-12">
            <div className="h-120 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          </div>
        ) : post ? (
          <>
            <section className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
              <div className="wrapper wrapper--lg">
                <h1 className="text-h3 font-semibold text-slate-950 dark:text-white mt-4">
                  {post.title}
                </h1>
                {post.author && (
                  <p className="text-smaller text-slate-500 mt-4">
                    By {post.author.fullName}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Newspaper className="size-3" />
                    {post.category}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="size-3" />
                    {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>
            </section>

            {post.thumbnailUrl && (
              <div className="wrapper wrapper--lg py-8">
                <img
                  src={post.thumbnailUrl}
                  alt={post.title}
                  className="w-full max-h-208 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
                />
              </div>
            )}

            <article className="wrapper wrapper--lg	 pb-16">
              <div className="prose prose-slate dark:prose-invert max-w-none bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 md:p-8 investpro-blog-content">
                <MarkdownPreview
                  source={post.content}
                  rehypePlugins={[[rehypeSanitize]]}
                  style={{ background: "transparent", color: "inherit" }}
                />
              </div>
              <style jsx global>{`
                .investpro-blog-content .wmde-markdown {
                  font-family: inherit;
                  background: transparent;
                }
                .investpro-blog-content .wmde-markdown img {
                  border-radius: 0.75rem;
                  margin: 1rem 0;
                }
              `}</style>
            </article>
          </>
        ) : (
          <div className="wrapper wrapper--md py-16 text-center text-slate-500">
            Blog post not found.
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
