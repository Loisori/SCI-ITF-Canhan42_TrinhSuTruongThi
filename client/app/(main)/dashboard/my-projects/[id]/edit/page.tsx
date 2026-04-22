"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";
import api from "@/lib/axios";
import { Profile } from "@/types/user";
import { ProjectCategory, ProjectDetail } from "@/types/project";
import { ToastState } from "@/types/ui";
import MarkdownField from "@/components/client/MarkdownField";

export default function EditProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);

  const [categoryId, setCategoryId] = useState(0);
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [content, setContent] = useState("");
  const [address, setAddress] = useState("");
  const [interestRate, setInterestRate] = useState(0);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [additionalImages, setAdditionalImages] = useState<string[]>([""]);
  const [projectStatus, setProjectStatus] = useState<string>("pending");

  useEffect(() => {
    const init = async () => {
      try {
        const profileRes = await api.get<Profile>("/api/auth/profile");

        if (profileRes.data.role !== "owner") {
          router.replace("/");
          return;
        }

        try {
          const categoriesRes = await api.get<ProjectCategory[]>(
            "/api/project-categories",
          );
          setCategories(categoriesRes.data);
        } catch {
          setCategories([]);
          setError("Không thể tải danh mục dự án.");
        }

        const detailRes = await api.get<ProjectDetail>(
          `/api/projects/${params.id}`,
        );
        const project = detailRes.data;

        setCategoryId(project.category?.id ?? 0);
        setTitle(project.title);
        setShortDescription(project.shortDescription ?? "");
        setContent(project.content ?? "");
        setInterestRate(Number(project.interestRate));
        setProjectStatus(project.status ?? "pending");
        setAddress(project.address ?? "");
        setThumbnailUrl(project.thumbnailUrl ?? "");
        setAdditionalImages(project.images?.length ? project.images : [""]);
      } catch {
        setError("Không thể tải dữ liệu dự án để chỉnh sửa.");
      } finally {
        setLoading(false);
        setLoadingCategories(false);
      }
    };

    void init();
  }, [params.id, router]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const normalizedGallery = useMemo(
    () =>
      additionalImages
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    [additionalImages],
  );
  const hasNoCategories = !loadingCategories && categories.length === 0;

  const handleStopFunding = async () => {
    if (projectStatus !== "funding") {
      setToast({
        type: "error",
        message: "Dự án hiện không ở trạng thái đang huy động vốn.",
      });
      return;
    }

    const confirmed = window.confirm(
      "Bạn có chắc muốn dừng nhận vốn dự án này?",
    );
    if (!confirmed) {
      return;
    }

    try {
      await api.put(`/api/projects/${params.id}/stop-funding`);
      setProjectStatus("completed");
      setToast({ type: "success", message: "Đã dừng nhận vốn thành công." });
      router.refresh();
    } catch (err: unknown) {
      const message =
        (
          err as {
            response?: { data?: { message?: string | string[] } };
          }
        )?.response?.data?.message ?? "Không thể dừng nhận vốn.";
      setToast({
        type: "error",
        message: Array.isArray(message) ? message[0] : message,
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (categoryId <= 0) {
      const message = "Vui lòng chọn danh mục dự án.";
      setError(message);
      setToast({ type: "error", message });
      setSubmitting(false);
      return;
    }

    try {
      await api.put(`/api/projects/${params.id}`, {
        categoryId: Number(categoryId),
        title,
        shortDescription,
        content,
        interestRate: Number(interestRate),
        address,
        thumbnailUrl,
        additional_images: normalizedGallery,
      });

      setToast({ type: "success", message: "Cập nhật dự án thành công." });
      router.refresh();
    } catch (err: unknown) {
      const message =
        (
          err as {
            response?: { data?: { message?: string | string[] } };
          }
        )?.response?.data?.message ?? "Cập nhật dự án thất bại.";

      const normalized = Array.isArray(message) ? message[0] : message;
      setError(normalized);
      setToast({ type: "error", message: normalized });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
        <Navbar />
        <main className="wrapper wrapper--md py-14 animate-pulse space-y-4">
          <div className="h-8 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-64 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />

      {toast && (
        <div className="fixed top-20 right-5 z-60">
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

      <main className="wrapper wrapper--md py-10">
        <h1 className="text-h3 font-black mb-2">Chỉnh sửa dự án</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Cập nhật thông tin và gallery để tăng sức hút với nhà đầu tư.
        </p>

        {error && <div className="mb-4 text-red-500 text-small">{error}</div>}
        {loadingCategories && (
          <div className="mb-4 text-small text-slate-500">
            Đang tải danh mục...
          </div>
        )}
        {hasNoCategories && (
          <div className="mb-4 text-amber-600 text-small font-semibold">
            Chưa có danh mục nào, vui lòng liên hệ Admin để tạo danh mục trước.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800"
        >
          <div>
            <label className="block text-smaller font-semibold mb-2">
              Danh mục dự án
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              required
              disabled={loadingCategories || hasNoCategories}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
            >
              <option value={0}>-- Chọn danh mục --</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-smaller font-semibold mb-2">
              Tên dự án
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
            />
          </div>

          <div>
            <label className="block text-smaller font-semibold mb-2">
              Mô tả ngắn
            </label>
            <textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
            />
          </div>

          <div>
            <label className="block text-smaller font-semibold mb-2">
              Địa chỉ dự án
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="VD: Số 123, Quận 1, TP. HCM"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
            />
            <p className="text-[11px] text-slate-500 mt-1 italic">
              * Địa chỉ chính xác giúp nhà đầu tư tin tưởng dự án của bạn hơn.
            </p>
          </div>

          <div className="markdown-field-wrapper">
            <MarkdownField
              value={content}
              onChange={setContent}
              label="Nội dung chi tiết (Markdown)"
            />
          </div>

          <div>
            <label className="block text-smaller font-semibold mb-2">
              Lãi suất (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
            />
          </div>

          <div>
            <label className="block text-smaller font-semibold mb-2">
              Ảnh chính (Thumbnail)
            </label>
            <input
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
            />
            {thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnailUrl}
                alt="thumbnail preview"
                className="mt-3 h-28 w-44 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
              />
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-smaller font-semibold">
                Ảnh phụ (Gallery)
              </label>
              <button
                type="button"
                onClick={() => setAdditionalImages((prev) => [...prev, ""])}
                className="px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-smaller font-semibold"
              >
                + Thêm ảnh phụ
              </button>
            </div>

            <div className="space-y-3">
              {additionalImages.map((image, index) => (
                <div
                  key={`${index}-${image}`}
                  className="flex items-center gap-2"
                >
                  <input
                    value={image}
                    onChange={(e) =>
                      setAdditionalImages((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index ? e.target.value : item,
                        ),
                      )
                    }
                    placeholder="https://..."
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                  <button
                    type="button"
                    disabled={additionalImages.length === 1}
                    onClick={() =>
                      setAdditionalImages((prev) =>
                        prev.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    className="px-3 py-2 rounded-md text-red-600 border border-red-200 disabled:opacity-40"
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>

            {normalizedGallery.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {normalizedGallery.map((image) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={image}
                    src={image}
                    alt="gallery preview"
                    className="h-20 w-28 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting || loadingCategories || hasNoCategories}
              className="px-6 py-2 rounded-lg bg-primary text-white font-bold disabled:opacity-60"
            >
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
            <button
              type="button"
              onClick={handleStopFunding}
              disabled={projectStatus !== "funding"}
              className="px-6 py-2 rounded-lg bg-red-600 text-white font-bold disabled:opacity-40"
            >
              Dừng nhận vốn
            </button>
            <button
              type="button"
              onClick={() => router.push("/projects")}
              className="px-6 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold"
            >
              Quay lại
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
