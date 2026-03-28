"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import axios from "axios";
import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";

type Me = {
  role: string;
};

export default function CreateProjectPage() {
  const router = useRouter();
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [interestRate, setInterestRate] = useState(12);
  const [durationMonths, setDurationMonths] = useState(12);
  const [targetCapital, setTargetCapital] = useState(1000000000);
  const [contentSlug, setContentSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  useEffect(() => {
    const checkOwner = async () => {
      const token = Cookies.get("access_token");

      if (!token) {
        router.replace("/");
        return;
      }

      try {
        const res = await axios.get<Me>(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.role !== "owner") {
          router.replace("/");
          return;
        }
      } catch {
        router.replace("/");
        return;
      } finally {
        setLoadingAuth(false);
      }
    };

    void checkOwner();
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const token = Cookies.get("access_token");

    if (!token) {
      setError("Bạn chưa đăng nhập.");
      setSubmitting(false);
      return;
    }

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects`,
        {
          title,
          interestRate,
          durationMonths,
          targetCapital,
          contentSlug,
          shortDescription,
          thumbnailUrl,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      router.push("/projects");
      router.refresh();
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Tạo dự án thất bại. Vui lòng thử lại.";
      setError(Array.isArray(message) ? message[0] : message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingAuth) {
    return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
        <Navbar />
        <main className="wrapper wrapper--md py-16">Đang kiểm tra quyền...</main>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />

      <main className="wrapper wrapper--md py-10">
        <h1 className="text-h3 font-black mb-2">Tạo dự án mới</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Khu vực dành riêng cho Owner.
        </p>

        {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-smaller font-semibold mb-2">Tên dự án</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-smaller font-semibold mb-2">Lãi suất (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
              />
            </div>

            <div>
              <label className="block text-smaller font-semibold mb-2">Thời hạn (tháng)</label>
              <input
                type="number"
                min="1"
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-smaller font-semibold mb-2">Vốn mục tiêu</label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={targetCapital}
              onChange={(e) => setTargetCapital(Number(e.target.value))}
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
            />
          </div>

          <div>
            <label className="block text-smaller font-semibold mb-2">content_slug</label>
            <input
              value={contentSlug}
              onChange={(e) => setContentSlug(e.target.value)}
              required
              placeholder="vd: can-ho-vista-q2"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
            />
          </div>

          <div>
            <label className="block text-smaller font-semibold mb-2">Mô tả ngắn</label>
            <textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
            />
          </div>

          <div>
            <label className="block text-smaller font-semibold mb-2">URL ảnh bìa</label>
            <input
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 rounded-lg bg-primary text-white font-bold disabled:opacity-60"
          >
            {submitting ? "Đang tạo..." : "Tạo dự án"}
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
}
