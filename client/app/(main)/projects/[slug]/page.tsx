"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import axios from "axios";
import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";

type ProjectDetail = {
  id: number;
  title: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  contentSlug: string | null;
  targetCapital: number;
  currentCapital: number;
  fundingProgress: number;
  interestRate: number;
  durationMonths: number;
  content: string | null;
};

type Me = {
  role: string;
};

export default function ProjectDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [role, setRole] = useState<string | null>(null);
  const [amount, setAmount] = useState(1000000);
  const [investing, setInvesting] = useState(false);
  const [investMessage, setInvestMessage] = useState<string | null>(null);

  useEffect(() => {
    const slug = params.slug;

    const fetchDetail = async () => {
      try {
        const res = await axios.get<ProjectDetail>(
          `${process.env.NEXT_PUBLIC_API_URL}/api/projects/slug/${slug}`,
        );
        setProject(res.data);
      } catch {
        setError("Không tìm thấy dự án.");
      } finally {
        setLoading(false);
      }
    };

    const fetchMe = async () => {
      const token = Cookies.get("access_token");
      if (!token) {
        setRole(null);
        return;
      }

      try {
        const me = await axios.get<Me>(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRole(me.data.role);
      } catch {
        setRole(null);
      }
    };

    void fetchDetail();
    void fetchMe();
  }, [params.slug]);

  const canInvest = useMemo(() => role === "investor", [role]);

  const handleInvest = async (e: FormEvent) => {
    e.preventDefault();

    if (!project) {
      return;
    }

    const token = Cookies.get("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setInvesting(true);
    setInvestMessage(null);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects/invest`,
        {
          projectId: project.id,
          amount,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setInvestMessage("Đầu tư thành công.");

      const refreshed = await axios.get<ProjectDetail>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects/slug/${params.slug}`,
      );
      setProject(refreshed.data);
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Đầu tư thất bại.";
      setInvestMessage(Array.isArray(message) ? message[0] : message);
    } finally {
      setInvesting(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />

      <main className="wrapper wrapper--lg py-10">
        {loading && <div>Đang tải chi tiết dự án...</div>}

        {!loading && error && <div className="text-red-500">{error}</div>}

        {!loading && !error && project && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <section className="lg:col-span-2 space-y-6">
              <h1 className="text-h3 font-black text-slate-900 dark:text-white">
                {project.title}
              </h1>

              {project.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={project.thumbnailUrl}
                  alt={project.title}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800"
                />
              )}

              <p className="text-slate-600 dark:text-slate-400">
                {project.shortDescription || "Dự án chưa có mô tả ngắn."}
              </p>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                <h2 className="text-h6 font-bold mb-3">Nội dung dự án (Markdown)</h2>
                <pre className="whitespace-pre-wrap text-smaller text-slate-700 dark:text-slate-300 leading-relaxed">
                  {project.content || "Chưa có nội dung markdown cho content_slug này."}
                </pre>
              </div>
            </section>

            <aside className="space-y-5">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                <h3 className="text-h6 font-bold mb-4">Thông số đầu tư</h3>
                <div className="space-y-3 text-smaller">
                  <div className="flex justify-between">
                    <span>Lãi suất</span>
                    <span className="font-bold">{Number(project.interestRate).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thời hạn</span>
                    <span className="font-bold">{project.durationMonths} tháng</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Đã huy động</span>
                    <span className="font-bold">{Number(project.currentCapital).toLocaleString()} đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mục tiêu</span>
                    <span className="font-bold">{Number(project.targetCapital).toLocaleString()} đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tiến độ</span>
                    <span className="font-bold text-primary">{project.fundingProgress}%</span>
                  </div>
                </div>
              </div>

              {canInvest ? (
                <form
                  onSubmit={handleInvest}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3"
                >
                  <label className="block text-smaller font-semibold">Số tiền đầu tư</label>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                  />

                  <button
                    type="submit"
                    disabled={investing}
                    className="w-full py-2 rounded-lg bg-primary text-white font-bold disabled:opacity-60"
                  >
                    {investing ? "Đang xử lý..." : "Đầu tư vào dự án này"}
                  </button>

                  {investMessage && (
                    <p className="text-smaller text-slate-600 dark:text-slate-400">{investMessage}</p>
                  )}
                </form>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 text-smaller text-slate-600 dark:text-slate-400">
                  Chỉ tài khoản Investor mới có thể đầu tư dự án.
                </div>
              )}
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
