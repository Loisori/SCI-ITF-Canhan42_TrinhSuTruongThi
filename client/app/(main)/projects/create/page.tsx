"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";
import api from "@/lib/axios";
import { Me } from "@/types/user";
import { ProjectCategory } from "@/types/project";
import MediaLibraryModal from "@/components/client/MediaLibraryModal";
import MarkdownField from "@/components/client/MarkdownField";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const getTodayString = () => new Date().toISOString().split("T")[0];

export default function CreateProjectPage() {
  const router = useRouter();
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(0);
  const [interestRate, setInterestRate] = useState<number | string>();
  const [durationMonths, setDurationMonths] = useState<number | string>();
  const [targetCapital, setTargetCapital] = useState<number | string>();
  const [minInvestment, setMinInvestment] = useState<number | string>();
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">(
    "medium",
  );
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState("");
  const [allowOverfunding, setAllowOverfunding] = useState(false);
  const [shortDescription, setShortDescription] = useState("");
  const [content, setContent] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [address, setAddress] = useState("");
  const [additionalImages, setAdditionalImages] = useState<string[]>([""]);
  const [milestones, setMilestones] = useState<
    {
      title: string;
      content: string;
      percentage: number;
      stage: number;
      intervalDays: number;
    }[]
  >([
    {
      title: "Đợt 1: Khởi động",
      content: "",
      percentage: 20,
      stage: 1,
      intervalDays: 0,
    },
    {
      title: "Đợt 2: Triển khai",
      content: "",
      percentage: 30,
      stage: 2,
      intervalDays: 30,
    },
    {
      title: "Đợt 3: Hoàn thiện",
      content: "",
      percentage: 50,
      stage: 3,
      intervalDays: 30,
    },
  ]);
  const contentSlug = slugify(title);

  // Media Library state
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [currentImageTarget, setCurrentImageTarget] = useState<
    "thumbnail" | number | null
  >(null);

  useEffect(() => {
    const init = async () => {
      try {
        const profileRes = await api.get<Me>("/api/auth/profile");

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
      } catch {
        router.replace("/");
        return;
      } finally {
        setLoadingAuth(false);
        setLoadingCategories(false);
      }
    };

    void init();
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (categoryId <= 0) {
      setError("Vui lòng chọn danh mục dự án.");
      setSubmitting(false);
      return;
    }

    if (!contentSlug) {
      setError("Tiêu đề dự án chưa hợp lệ để tạo slug.");
      setSubmitting(false);
      return;
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setError("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        title,
        categoryId: Number(categoryId),
        interestRate: Number(interestRate),
        durationMonths: Number(durationMonths),
        targetCapital: Number(targetCapital),
        minInvestment: Number(minInvestment),
        riskLevel,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: "pending",
        contentSlug,
        allowOverfunding,
        shortDescription,
        content,
        address,
        thumbnailUrl,
        additional_images: additionalImages
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
        milestones: milestones.map((m) => ({
          ...m,
          percentage: Number(m.percentage),
          intervalDays: Number(m.intervalDays),
        })),
      };

      await api.post("/api/projects", payload);

      router.push("/projects");
      router.refresh();
    } catch (error: unknown) {
      const rawMessage = (
        error as {
          response?: {
            data?: { message?: string | string[] };
          };
        }
      )?.response?.data?.message;

      const message = rawMessage ?? "Tạo dự án thất bại. Vui lòng thử lại.";
      const normalizedMessage = Array.isArray(message)
        ? (message[0] ?? "Tạo dự án thất bại. Vui lòng thử lại.")
        : message;
      setError(normalizedMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingAuth) {
    return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
        <Navbar />
        <main className="wrapper wrapper--md py-16">
          Đang kiểm tra quyền...
        </main>
      </div>
    );
  }

  const hasNoCategories = !loadingCategories && categories.length === 0;

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />

      <main className="wrapper wrapper--md py-10">
        <h1 className="text-h3 font-black mb-2">Tạo dự án mới</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Khu vực dành riêng cho Owner.
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-smaller font-semibold mb-2">
                Lãi suất (%)
              </label>
              <input
                type="text"
                min="1"
                max="10"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
              />
            </div>

            <div>
              <label className="block text-smaller font-semibold mb-2">
                Thời hạn (tháng)
              </label>
              <input
                type="text"
                min="1"
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
              />
            </div>

            <div>
              <label className="block text-smaller font-semibold mb-2">
                Vốn mục tiêu
              </label>
              <input
                type="text"
                min="1"
                value={targetCapital}
                onChange={(e) => setTargetCapital(Number(e.target.value))}
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
              />
            </div>

            <div>
              <label className="block text-smaller font-semibold mb-2">
                Vốn đầu tư tối thiểu
              </label>
              <input
                type="text"
                min="1"
                value={minInvestment}
                onChange={(e) => setMinInvestment(Number(e.target.value))}
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
              />
            </div>

            <div>
              <label className="block text-smaller font-semibold mb-2">
                Mức độ rủi ro
              </label>
              <select
                value={riskLevel}
                onChange={(e) =>
                  setRiskLevel(e.target.value as "low" | "medium" | "high")
                }
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
              </select>
            </div>

            <div>
              <label className="block text-smaller font-semibold mb-2">
                Trạng thái
              </label>
              <input
                value="pending"
                readOnly
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-smaller font-semibold mb-2">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={startDate}
                min={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
              />
            </div>
            <div>
              <label className="block text-smaller font-semibold mb-2">
                Ngày kết thúc (deadline)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
            <input
              type="checkbox"
              id="allowOverfunding"
              checked={allowOverfunding}
              onChange={(e) => setAllowOverfunding(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <div>
              <label
                htmlFor="allowOverfunding"
                className="text-small font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                Cho phép đầu tư vượt mục tiêu (Overfunding)
              </label>
              <p className="text-[11px] text-slate-500">
                Nếu bật, dự án tiếp tục nhận vốn đến ngày kết thúc. Nếu tắt, dự
                án sẽ đóng ngay khi đạt 100%.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-smaller font-semibold mb-2">
              Slug (tự động)
            </label>
            <input
              value={contentSlug}
              readOnly
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-500"
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

          <div>
            <label className="block text-smaller font-semibold mb-2">
              Mô tả ngắn
            </label>
            <textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
            />
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
              URL ảnh bìa
            </label>
            <div className="flex items-center gap-2">
              <input
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent flex-1"
              />
              <button
                type="button"
                onClick={() => {
                  setCurrentImageTarget("thumbnail");
                  setIsMediaModalOpen(true);
                }}
                className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition whitespace-nowrap"
              >
                Chọn từ Thư viện
              </button>
            </div>
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
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentImageTarget(index);
                      setIsMediaModalOpen(true);
                    }}
                    className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition whitespace-nowrap"
                  >
                    Thư viện
                  </button>
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

            {additionalImages.some((item) => item.trim()) && (
              <div className="flex flex-wrap gap-3 mt-4">
                {additionalImages
                  .map((item) => item.trim())
                  .filter((item) => item.length > 0)
                  .map((item) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={item}
                      src={item}
                      alt="gallery preview"
                      className="h-20 w-28 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                    />
                  ))}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-body font-bold">
                  Giai đoạn giải ngân (Milestones)
                </h3>
                <p className="text-smaller text-slate-500">
                  Thiết lập 2-5 đợt giải ngân. Tổng phải bằng 100%.
                </p>
              </div>
              <button
                type="button"
                disabled={milestones.length >= 5}
                onClick={() =>
                  setMilestones((prev) => [
                    ...prev,
                    {
                      title: `Đợt ${prev.length + 1}`,
                      content: "",
                      percentage: 0,
                      stage: prev.length + 1,
                      intervalDays: 30,
                    },
                  ])
                }
                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-smaller font-bold disabled:opacity-50"
              >
                + Thêm đợt
              </button>
            </div>

            <div className="space-y-4">
              {milestones.map((m, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-smaller font-bold text-primary">
                      Đợt {m.stage}
                    </span>
                    {milestones.length > 2 && (
                      <button
                        type="button"
                        onClick={() =>
                          setMilestones((prev) => {
                            const filtered = prev.filter((_, i) => i !== index);
                            return filtered.map((item, i) => ({
                              ...item,
                              stage: i + 1,
                            }));
                          })
                        }
                        className="text-red-500 text-smaller font-semibold"
                      >
                        Xóa đợt này
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <input
                        placeholder="Tiêu đề đợt (VD: Khởi động dự án)"
                        value={m.title}
                        onChange={(e) =>
                          setMilestones((prev) =>
                            prev.map((item, i) =>
                              i === index
                                ? { ...item, title: e.target.value }
                                : item,
                            ),
                          )
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-small"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="% vốn"
                        value={m.percentage}
                        onChange={(e) =>
                          setMilestones((prev) =>
                            prev.map((item, i) =>
                              i === index
                                ? {
                                    ...item,
                                    percentage: Number(e.target.value),
                                  }
                                : item,
                            ),
                          )
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-small pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-small">
                        %
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Ngày chờ"
                        value={m.intervalDays}
                        onChange={(e) =>
                          setMilestones((prev) =>
                            prev.map((item, i) =>
                              i === index
                                ? {
                                    ...item,
                                    intervalDays: Number(e.target.value),
                                  }
                                : item,
                            ),
                          )
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-small pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                        ngày
                      </span>
                    </div>
                  </div>
                  <textarea
                    placeholder="Mô tả công việc dự kiến cho giai đoạn này..."
                    value={m.content}
                    onChange={(e) =>
                      setMilestones((prev) =>
                        prev.map((item, i) =>
                          i === index
                            ? { ...item, content: e.target.value }
                            : item,
                        ),
                      )
                    }
                    rows={2}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-small"
                  />
                </div>
              ))}
              <div className="flex justify-end pr-2">
                <span
                  className={`text-small font-bold ${milestones.reduce((s, m) => s + m.percentage, 0) === 100 ? "text-green-600" : "text-red-500"}`}
                >
                  Tổng cộng: {milestones.reduce((s, m) => s + m.percentage, 0)}%
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || loadingCategories || hasNoCategories}
            className="px-6 py-2 rounded-lg bg-primary text-white font-bold disabled:opacity-60"
          >
            {submitting ? "Đang tạo..." : "Tạo dự án"}
          </button>
        </form>
      </main>

      <Footer />

      <MediaLibraryModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(url) => {
          if (currentImageTarget === "thumbnail") {
            setThumbnailUrl(url);
          } else if (typeof currentImageTarget === "number") {
            setAdditionalImages((prev) =>
              prev.map((item, index) =>
                index === currentImageTarget ? url : item,
              ),
            );
          }
          setIsMediaModalOpen(false);
        }}
      />
    </div>
  );
}
