"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";
import api from "@/lib/axios";
import { ProjectDetail } from "@/types/project";
import { Profile } from "@/types/user";
import { ToastState } from "@/types/ui";
import ProjectMilestones from "@/components/client/ProjectMilestones";
import dynamic from "next/dynamic";
import rehypeSanitize from "rehype-sanitize";

const MarkdownPreview = dynamic(
  () => import("@uiw/react-markdown-preview"),
  { ssr: false, loading: () => <div className="animate-pulse h-64 bg-slate-100 rounded-xl"></div> }
);

function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
      <section className="lg:col-span-2 space-y-6">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="w-full aspect-video bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded" />
      </section>
      <aside className="space-y-5">
        <div className="h-56 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </aside>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [amount, setAmount] = useState(0);
  const [investing, setInvesting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchProject = async () => {
    if (!params.slug) return;
    try {
      const isNumericId = /^\d+$/.test(params.slug as string);
      const endpoint = isNumericId
        ? `/api/projects/${params.slug}`
        : `/api/projects/slug/${params.slug}`;
      const res = await api.get<ProjectDetail>(endpoint);

      setProject(res.data);
      setSelectedImage(res.data.thumbnailUrl ?? res.data.images?.[0] ?? null);
      setAmount(Number(res.data.minInvestment || 1));
    } catch {
      setError("Không tìm thấy dự án.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const me = await api.get<Profile>("/api/auth/profile");
        setRole(me.data.role);
      } catch {
        setRole(null);
      }
    };

    void fetchProject();
    void fetchProfile();
  }, [params.slug]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("investpro-project-context", {
        detail: project
          ? {
              id: project.id,
              title: project.title,
              shortDescription: project.shortDescription,
              interestRate: project.interestRate,
              durationMonths: project.durationMonths,
              minInvestment: project.minInvestment,
              targetCapital: project.targetCapital,
              currentCapital: project.currentCapital,
              fundingProgress: project.fundingProgress,
              riskLevel: (project as { riskLevel?: string }).riskLevel ?? null,
              status: project.status,
              category: project.category ?? null,
              owner: project.owner ?? null,
              endDate: project.endDate,
            }
          : null,
      }),
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent("investpro-project-context", { detail: null }),
      );
    };
  }, [project]);

  const isFundingOpen = useMemo(() => {
    if (!project) {
      return false;
    }

    if (project.status !== "funding") {
      return false;
    }

    if (!project.endDate) {
      return true;
    }

    const deadline = new Date(project.endDate).getTime();
    return deadline >= Date.now();
  }, [project]);

  const canInvest = useMemo(
    () => role === "investor" && isFundingOpen,
    [role, isFundingOpen],
  );

  const handleInvest = async (e: FormEvent) => {
    e.preventDefault();

    if (!project) {
      return;
    }

    const minInvestment = Number(project.minInvestment || 1);
    if (Number(amount) < minInvestment) {
      setToast({
        type: "error",
        message: `Số tiền tối thiểu là ${minInvestment.toLocaleString("vi-VN")}.`,
      });
      return;
    }

    setInvesting(true);

    try {
      await api.post("/api/investments", {
        projectId: project.id,
        amount: Number(amount),
      });

      setToast({
        type: "success",
        message: "Chúc mừng bạn đã trở thành nhà đầu tư!",
      });

      const refreshed = await api.get<ProjectDetail>(
        `/api/projects/${project.id}`,
      );
      setProject(refreshed.data);
      setSelectedImage(
        refreshed.data.thumbnailUrl ?? refreshed.data.images?.[0] ?? null,
      );
      setAmount(Number(refreshed.data.minInvestment || 1));

      window.dispatchEvent(new Event("auth-changed"));
      router.refresh();
    } catch (error: unknown) {
      const message =
        (
          error as {
            response?: { data?: { message?: string | string[] } };
          }
        )?.response?.data?.message ?? "Đầu tư thất bại.";

      setToast({
        type: "error",
        message: Array.isArray(message) ? message[0] : message,
      });
    } finally {
      setInvesting(false);
    }
  };

  const galleryImages = useMemo(() => {
    if (!project) {
      return [];
    }

    return [project.thumbnailUrl, ...(project.images ?? [])]
      .filter((item): item is string => Boolean(item))
      .filter((item, index, arr) => arr.indexOf(item) === index);
  }, [project]);

  const progress = useMemo(() => {
    if (!project) {
      return 0;
    }
    return Number(project.fundingProgress) || 0;
  }, [project]);

  const baseProgress = Math.min(progress, 100);
  const overProgress = Math.max(progress - 100, 0);

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />

      {toast && (
        <div className="fixed top-20 right-5 z-[60]">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg text-small font-semibold ${
              toast.type === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      <main className="wrapper wrapper--lg py-10">
        {loading && <DetailSkeleton />}
        {!loading && error && <div className="text-red-500">{error}</div>}

        {!loading && !error && project && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <section className="lg:col-span-2 space-y-6">
              <h1 className="text-h3 font-black text-slate-900 dark:text-white">
                {project.title}
              </h1>

              {selectedImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedImage}
                  alt={project.title}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 aspect-video object-cover"
                />
              )}

              {galleryImages.length > 1 && (
                <div className="flex flex-wrap gap-3">
                  {galleryImages.map((image) => (
                    <button
                      type="button"
                      key={image}
                      onClick={() => setSelectedImage(image)}
                      className={`rounded-lg overflow-hidden border-2 ${
                        selectedImage === image
                          ? "border-primary"
                          : "border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image}
                        alt="project gallery"
                        className="h-20 w-28 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              <p className="text-slate-600 dark:text-slate-400">
                {project.shortDescription || "Dự án chưa có mô tả ngắn."}
              </p>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 investpro-markdown-preview">
                <h2 className="text-h6 font-bold mb-3">
                  Nội dung dự án
                </h2>
                {project.content ? (
                  <MarkdownPreview 
                    source={project.content} 
                    rehypePlugins={[[rehypeSanitize]]} 
                    style={{ background: 'transparent', color: 'inherit' }}
                  />
                ) : (
                  <p className="text-smaller text-slate-500">Chưa có nội dung markdown.</p>
                )}
                
                <style jsx global>{`
                  .investpro-markdown-preview .wmde-markdown {
                    font-family: inherit;
                  }
                  .investpro-markdown-preview .wmde-markdown h1,
                  .investpro-markdown-preview .wmde-markdown h2,
                  .investpro-markdown-preview .wmde-markdown h3 {
                    color: var(--color-primary, #4f46e5); /* Use primary color */
                    border-bottom: none;
                  }
                  .dark .investpro-markdown-preview .wmde-markdown h1,
                  .dark .investpro-markdown-preview .wmde-markdown h2,
                  .dark .investpro-markdown-preview .wmde-markdown h3 {
                    color: var(--color-primary, #818cf8); /* Lighter primary for dark mode */
                  }
                  .investpro-markdown-preview .wmde-markdown img {
                    border-radius: 0.75rem;
                    margin: 1rem 0;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                  }
                  .investpro-markdown-preview .wmde-markdown a {
                    color: var(--color-primary, #4f46e5);
                  }
                `}</style>
              </div>

              {/* Milestones & Disputes Component */}
              <ProjectMilestones project={project} role={role === "business" && project.owner && project.owner.id ? "business" : role} onUpdate={fetchProject} setToast={setToast} />
            </section>

            <aside className="space-y-5">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                <h3 className="text-h6 font-bold mb-4">Thông số đầu tư</h3>
                <div className="space-y-3 text-smaller">
                  <div className="flex justify-between">
                    <span>Lãi suất</span>
                    <span className="font-bold">
                      {Number(project.interestRate).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thời hạn</span>
                    <span className="font-bold">
                      {project.durationMonths} tháng
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tối thiểu</span>
                    <span className="font-bold">
                      {Number(project.minInvestment).toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Đã huy động</span>
                    <span className="font-bold">
                      {Number(project.currentCapital).toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mục tiêu</span>
                    <span className="font-bold">
                      {Number(project.targetCapital).toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tiến độ</span>
                    <span className="font-bold text-primary">
                      {Number(project.fundingProgress).toFixed(2)}%
                    </span>
                  </div>
                  <div className="pt-1">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full"
                        style={{ width: `${baseProgress}%` }}
                      />
                    </div>
                    {overProgress > 0 && (
                      <div className="mt-1.5">
                        <div className="w-full bg-orange-100 dark:bg-orange-900/30 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-orange-500 h-full"
                            style={{ width: `${Math.min(overProgress, 100)}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] font-semibold text-orange-600 dark:text-orange-300">
                          Vượt mục tiêu +{overProgress.toFixed(2)}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {canInvest ? (
                <form
                  onSubmit={handleInvest}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3"
                >
                  <label className="block text-smaller font-semibold">
                    Số tiền đầu tư
                  </label>
                  <input
                    type="number"
                    // min={Number(project.minInvestment || 1)}
                    min={Number(project.minInvestment)}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                  />

                  <button
                    type="submit"
                    disabled={investing}
                    className="w-full py-2 rounded-lg bg-primary text-white font-bold disabled:opacity-60"
                  >
                    {investing ? "Đang xử lý..." : "Xác nhận đầu tư"}
                  </button>
                </form>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 text-smaller text-slate-600 dark:text-slate-400">
                  {role !== "investor"
                    ? "Chỉ tài khoản Investor mới có thể đầu tư dự án."
                    : "Dự án đã đóng cổng nhận vốn (đã dừng hoặc quá deadline)."}
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
