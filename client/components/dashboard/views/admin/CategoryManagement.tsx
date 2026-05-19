"use client";

import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  Edit3,
  FolderOpen,
  ImageIcon,
  Plus,
  Search,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";

type AdminProjectCategory = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  createdAt: string;
  projectCount: number;
};

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  iconUrl: string;
};

const emptyForm: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  iconUrl: "",
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as { message?: unknown };
    return typeof responseData?.message === "string"
      ? responseData.message
      : fallback;
  }

  return fallback;
}

export default function CategoryManagement() {
  const [query, setQuery] = useState("");
  const [editingCategory, setEditingCategory] =
    useState<AdminProjectCategory | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);

  const {
    data: categories = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-project-categories"],
    queryFn: async () =>
      (await api.get<AdminProjectCategory[]>("/api/admin/project-categories"))
        .data,
  });

  const filteredCategories = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return categories;

    return categories.filter((category) =>
      [
        category.name,
        category.slug,
        category.description ?? "",
        String(category.projectCount),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [categories, query]);

  const startCreate = () => {
    setEditingCategory(null);
    setForm(emptyForm);
  };

  const startEdit = (category: AdminProjectCategory) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      iconUrl: category.iconUrl ?? "",
    });
  };

  const submitCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim() || null,
      iconUrl: form.iconUrl.trim() || null,
    };

    if (!payload.name) {
      toast.error("Vui lòng nhập tên danh mục.");
      return;
    }

    try {
      if (editingCategory) {
        await api.patch(
          `/api/admin/project-categories/${editingCategory.id}`,
          payload,
        );
        toast.success("Đã cập nhật danh mục.");
      } else {
        await api.post("/api/admin/project-categories", payload);
        toast.success("Đã tạo danh mục mới.");
      }

      setEditingCategory(null);
      setForm(emptyForm);
      refetch();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Không thể lưu danh mục."));
    }
  };

  const deleteCategory = async (category: AdminProjectCategory) => {
    if (category.projectCount > 0) {
      toast.error("Không thể xóa danh mục đang có dự án sử dụng.");
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/api/admin/project-categories/${category.id}`);
      toast.success("Đã xóa danh mục.");
      if (editingCategory?.id === category.id) {
        startCreate();
      }
      refetch();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Không thể xóa danh mục."));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-100 dark:bg-slate-800 w-1/4 rounded-lg" />
        <div className="h-80 bg-slate-100 dark:bg-slate-800 rounded-5" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-h3 font-bold text-slate-900 dark:text-white">
          Quản lý danh mục
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-body mt-1">
          Thêm, chỉnh sửa và kiểm soát các danh mục dùng cho dự án.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_24rem] gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-5 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800/50 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 dark:bg-white/5">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm tên, slug hoặc mô tả danh mục..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-smaller outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <button
              onClick={startCreate}
              className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-primary text-white text-smaller font-bold hover:shadow-lg hover:shadow-primary/20 transition"
            >
              <Plus className="size-4" />
              Thêm danh mục
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/60 dark:bg-slate-800/20 text-[11px] uppercase text-slate-400 font-bold tracking-widest border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Danh mục</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4">Dự án</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary overflow-hidden shrink-0">
                          {category.iconUrl ? (
                            <div
                              className="size-full bg-cover bg-center"
                              style={{
                                backgroundImage: `url(${category.iconUrl})`,
                              }}
                            />
                          ) : (
                            <Tags className="size-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-smaller font-bold text-slate-900 dark:text-white truncate max-w-72">
                            {category.name}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1 truncate max-w-96">
                            {category.description || "Chưa có mô tả"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                        {category.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-bold">
                        <FolderOpen className="size-3.5" />
                        {category.projectCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEdit(category)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition"
                        >
                          <Edit3 className="size-3.5" />
                          Sửa
                        </button>
                        <button
                          onClick={() => deleteCategory(category)}
                          disabled={category.projectCount > 0}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-[11px] font-bold hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="size-3.5" />
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCategories.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-16 text-center text-slate-500 text-smaller"
                    >
                      <Tags className="text-[56px] text-slate-200 mb-4 mx-auto" />
                      Không tìm thấy danh mục phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <form
          onSubmit={submitCategory}
          className="bg-white dark:bg-slate-900 rounded-5 border border-slate-200 dark:border-slate-800 shadow-sm p-5 h-fit space-y-5"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingCategory ? "Chỉnh sửa danh mục" : "Danh mục mới"}
              </h2>
              <p className="text-[11px] text-slate-500 mt-1">
                Slug sẽ tự tạo nếu để trống khi thêm mới.
              </p>
            </div>
            {editingCategory && (
              <button
                type="button"
                onClick={startCreate}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                title="Hủy chỉnh sửa"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <label className="block">
            <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
              Tên danh mục
            </span>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              className="mt-2 w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 text-smaller outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Ví dụ: Nông nghiệp"
            />
          </label>

          <label className="block">
            <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
              Slug
            </span>
            <input
              value={form.slug}
              onChange={(event) =>
                setForm((current) => ({ ...current, slug: event.target.value }))
              }
              className="mt-2 w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 text-smaller outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="nong-nghiep"
            />
          </label>

          <label className="block">
            <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
              Mô tả
            </span>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={4}
              className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-smaller outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Mô tả ngắn về nhóm dự án này"
            />
          </label>

          <label className="block">
            <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
              Icon URL
            </span>
            <div className="mt-2 relative">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                value={form.iconUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    iconUrl: event.target.value,
                  }))
                }
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-smaller outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="https://..."
              />
            </div>
          </label>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-white text-smaller font-bold hover:shadow-lg hover:shadow-primary/20 transition"
          >
            {editingCategory ? (
              <Edit3 className="size-4" />
            ) : (
              <Plus className="size-4" />
            )}
            {editingCategory ? "Lưu thay đổi" : "Tạo danh mục"}
          </button>
        </form>
      </div>
    </div>
  );
}
