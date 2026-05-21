"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Landmark,
  LineChart,
  LockKeyhole,
  Newspaper,
  Rocket,
  ShieldCheck,
  TrendingUp,
  Users,
  Vote,
} from "lucide-react";
import Navbar from "@/components/client/Navbar";
import FeaturedProjects from "@/components/client/FeaturedProjects";
import Footer from "@/components/client/Footer";
import api from "@/lib/axios";
import { BlogListResponse } from "@/types/blog";

type HomepageStats = {
  totalCapitalRaised: number;
  activeProjects: number;
  investors: number;
  averageReturnRate: number;
};

const defaultStats: HomepageStats = {
  totalCapitalRaised: 0,
  activeProjects: 0,
  investors: 0,
  averageReturnRate: 0,
};

const formatCurrency = (value: number) =>
  `${Math.round(value).toLocaleString("vi-VN")} đ`;

export default function Home() {
  const { data: stats = defaultStats } = useQuery({
    queryKey: ["homepage-stats"],
    queryFn: async () =>
      (await api.get<HomepageStats>("/api/projects/stats/homepage")).data,
    staleTime: 60_000,
  });

  const { data: latestBlogData, isLoading: loadingBlogs } = useQuery({
    queryKey: ["homepage-blogs"],
    queryFn: async () =>
      (
        await api.get<BlogListResponse>("/api/blogs", {
          params: { pageSize: 3 },
        })
      ).data,
    staleTime: 60_000,
  });

  const latestBlogs = latestBlogData?.items ?? [];

  const statItems = [
    {
      label: "Tổng vốn huy động",
      value: formatCurrency(stats.totalCapitalRaised),
      icon: Landmark,
    },
    {
      label: "Dự án đang hoạt động",
      value: Math.round(stats.activeProjects).toLocaleString("vi-VN"),
      icon: Rocket,
    },
    {
      label: "Nhà đầu tư",
      value: Math.round(stats.investors).toLocaleString("vi-VN"),
      icon: Users,
    },
    {
      label: "Tỷ lệ sinh lời trung bình",
      value: `${Math.round(stats.averageReturnRate)}%`,
      icon: TrendingUp,
    },
  ];

  const workflow = [
    {
      title: "Tài trợ",
      text: "Các nhà đầu tư cam kết vốn vào các cơ hội đã được xem xét kỹ lưỡng với các điều khoản rõ ràng.",
      icon: Landmark,
    },
    {
      title: "Kích hoạt dự án",
      text: "Vốn được khóa và lịch trình mốc đã được phê duyệt trở thành hợp đồng vận hành.",
      icon: CheckCircle2,
    },
    {
      title: "Bằng chứng mốc & Bỏ phiếu",
      text: "Chủ sở hữu nộp bằng chứng, nhà đầu tư xem xét tiến độ, và phiếu bầu quyết định tính sẵn sàng giải ngân.",
      icon: Vote,
    },
    {
      title: "Giải ngân an toàn",
      text: "Vốn chỉ được giải ngân khi các điều kiện mốc được đáp ứng.",
      icon: LockKeyhole,
    },
  ];

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />
      <main>
        <section className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <div className="wrapper wrapper--lg grid grid-cols-1 lg:grid-cols-[1.1fr_.9fr] gap-10 items-center py-16 lg:py-24">
            <div className="space-y-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-smallest font-bold uppercase tracking-wide text-primary">
                Tín dụng tư nhân bảo đảm bằng cột mốc giải ngân
              </span>
              <div className="space-y-4">
                <h1 className="text-h3 lg:text-[6.4rem] font-black leading-tight text-slate-950 dark:text-white">
                  Đầu tư minh bạch qua các mốc quan trọng
                </h1>
                <p className="max-w-2xl text-body text-slate-600 dark:text-slate-400 leading-relaxed">
                  InvestPro kết nối nhà đầu tư và chủ dự án thông qua cấp vốn
                  dựa trên cột mốc, bỏ phiếu của nhà đầu tư và rủi ro được hỗ
                  trợ bởi AI cái nhìn sâu sắc để vốn di chuyển với bằng chứng.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/projects"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-small font-bold text-white shadow-lg shadow-primary/20 transition hover:-translate-y-0.5"
                >
                  <LineChart className="size-4" />
                  Khám phá dự án
                </Link>
                <Link
                  href="/projects/create"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-6 py-3 text-small font-bold text-slate-900 dark:text-white transition hover:border-primary hover:text-primary"
                >
                  <Rocket className="size-4" />
                  Bắt đầu huy động vốn
                </Link>
              </div>
            </div>

            <div className="lg:pl-6">
              {/* <div className="aspect-4/3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-smallest uppercase tracking-wide text-slate-500 font-bold">
                      Milestone escrow
                    </p>
                    <p className="text-h5 font-black text-slate-950 dark:text-white">
                      Live progress control
                    </p>
                  </div>
                  <ShieldCheck className="text-primary size-10" />
                </div>
                <div className="space-y-4">
                  {["Capital locked", "Proof submitted", "Investor vote"].map(
                    (item, index) => (
                      <div key={item} className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-smaller font-bold">
                            <span>{item}</span>
                            <span>{[100, 72, 48][index]}%</span>
                          </div>
                          <div className="mt-2 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${[100, 72, 48][index]}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div> */}
            </div>
          </div>
        </section>

        <section className="py-10 bg-slate-50 dark:bg-slate-900/40">
          <div className="wrapper wrapper--lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statItems.map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5"
              >
                <item.icon className="size-5 text-primary mb-4" />
                <p className="text-h6 font-black text-slate-950 dark:text-white">
                  {item.value}
                </p>
                <p className="text-smaller text-slate-500 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 bg-white dark:bg-slate-950">
          <div className="wrapper wrapper--lg">
            <div className="max-w-2xl mb-10">
              <h2 className="text-h4 font-black text-slate-950 dark:text-white">
                Bảo mật cột mốc, được tích hợp trong mọi giao dịch
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-3">
                Việc tài trợ được cấu trúc dựa trên bằng chứng, xác minh và kiểm soát
                giải ngân thay vì giải ngân vốn một lần.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {workflow.map((step, index) => (
                <div
                  key={step.title}
                  className="relative rounded-lg border border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between mb-5">
                    <step.icon className="size-6 text-primary" />
                    <span className="text-smallest font-black text-slate-400">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="font-black text-slate-950 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="text-smaller text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-slate-950 text-white">
          <div className="wrapper wrapper--lg grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-smallest font-bold uppercase tracking-wide text-emerald-300">
                <Bot className="size-4" />
                Lợi thế công nghệ cốt lõi
              </span>
              <h2 className="text-h4 font-black mt-5">InvestPro AI, Cái nhìn sâu sắc</h2>
              <p className="text-slate-300 mt-4 leading-relaxed">
                Lớp AI của chúng tôi giúp các nhà đầu tư xem xét các tín hiệu rủi ro, các mốc quan trọng
                chất lượng, lịch sử chủ sở hữu và các nguyên tắc cơ bản của dự án trước khi chúng
                cam kết vốn.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                <ClipboardCheck className="size-7 text-emerald-300 mb-4" />
                <h3 className="font-black">Phân tích rủi ro</h3>
                <p className="text-smaller text-slate-300 mt-2">
                  Xem xét có cấu trúc về rủi ro trả nợ, khả thi của mốc,
                  và các tín hiệu thực hiện dự án.
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                <BarChart3 className="size-7 text-emerald-300 mb-4" />
                <h3 className="font-black">Đánh giá dự án thông minh</h3>
                <p className="text-smaller text-slate-300 mt-2">
                  Một điểm số rõ ràng giúp nhà đầu tư so sánh các cơ hội với
                  tiêu chí quyết định nhất quán.
                </p>
              </div>
            </div>
          </div>
        </section>

        <FeaturedProjects />

        <section className="py-16 bg-white dark:bg-slate-950">
          <div className="wrapper wrapper--lg">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-smallest font-bold uppercase tracking-wide text-primary">
                  <Newspaper className="size-4" />
                  Thông tin chi tiết mới nhất
                </span>
                <h2 className="text-h4 font-black text-slate-950 dark:text-white mt-4">
                  InvestPro Blog
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mt-3">
                  Những lưu ý thực tế về đầu tư quan trọng, đánh giá rủi ro và huy động vốn minh bạch.
                </p>
              </div>
              <Link
                href="/blogs"
                className="inline-flex items-center gap-2 text-primary font-bold text-smaller"
              >
                Xem tất cả bài viết
                <ArrowRight className="size-4" />
              </Link>
            </div>

            {loadingBlogs ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-80 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
                  />
                ))}
              </div>
            ) : latestBlogs.length ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {latestBlogs.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blogs/${post.slug}`}
                    className="group rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-hidden hover:border-primary/50 transition"
                  >
                    <div
                      className="aspect-video bg-slate-100 dark:bg-slate-800 bg-cover bg-center"
                      style={
                        post.thumbnailUrl
                          ? { backgroundImage: `url(${post.thumbnailUrl})` }
                          : undefined
                      }
                    >
                      {!post.thumbnailUrl && (
                        <div className="h-full w-full flex items-center justify-center">
                          <Newspaper className="size-10 text-slate-300" />
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
                      <h3 className="text-body font-black text-slate-950 dark:text-white mt-3 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-smaller text-slate-600 dark:text-slate-400 mt-3 line-clamp-3">
                        {post.excerpt || "Read the latest InvestPro insight."}
                      </p>
                      <span className="inline-flex items-center gap-2 text-primary font-bold text-smaller mt-5">
                        Read article
                        <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center text-slate-500">
                No published blog posts yet.
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
