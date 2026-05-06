"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Edit3,
  ImagePlus,
  Newspaper,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import MarkdownField from "@/components/client/MarkdownField";
import MediaLibraryModal from "@/components/client/MediaLibraryModal";
import { BlogListResponse, BlogPost, BlogStatus } from "@/types/blog";

const emptyForm = {
  title: "",
  category: "",
  thumbnailUrl: "",
  content: "",
  status: "draft" as BlogStatus,
};

export default function BlogManagement() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-blogs", query],
    queryFn: async () =>
      (
        await api.get<BlogListResponse>("/api/admin/blogs", {
          params: { search: query || undefined, pageSize: 50 },
        })
      ).data,
  });

  const posts = useMemo(() => data?.items ?? [], [data]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setQuery(search.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const openCreate = () => {
    setEditingPost(null);
    setForm(emptyForm);
    setIsEditorOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      category: post.category,
      thumbnailUrl: post.thumbnailUrl ?? "",
      content: post.content,
      status: post.status,
    });
    setIsEditorOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (editingPost) {
        await api.patch(`/api/admin/blogs/${editingPost.id}`, form);
        toast.success("Đã cập nhật bài viết.");
      } else {
        await api.post("/api/admin/blogs", form);
        toast.success("Đã tạo bài viết.");
      }

      setIsEditorOpen(false);
      setEditingPost(null);
      setForm(emptyForm);
      await refetch();
    } catch (error: unknown) {
      const message =
        (
          error as {
            response?: { data?: { message?: string | string[] } };
          }
        )?.response?.data?.message ?? "Không thể lưu bài viết.";
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post: BlogPost) => {
    if (!confirm(`Xóa bài viết "${post.title}"?`)) return;

    try {
      await api.delete(`/api/admin/blogs/${post.id}`);
      toast.success("Đã xóa bài viết.");
      await refetch();
    } catch (error: unknown) {
      const message =
        (
          error as {
            response?: { data?: { message?: string | string[] } };
          }
        )?.response?.data?.message ?? "Không thể xóa bài viết.";
      toast.error(Array.isArray(message) ? message[0] : message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-h3 font-bold text-slate-900 dark:text-white">
            Blog Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-body mt-1">
            Create, publish, and manage InvestPro market insights.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-smaller font-bold text-white"
        >
          <Plus className="size-4" />
          New Blog Post
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, slug, category..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent py-2 pl-10 pr-3 text-small outline-none focus:ring-1 ring-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-bold">Post</th>
                <th className="px-4 py-3 font-bold">Category</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Created</th>
                <th className="px-4 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    Loading blog posts...
                  </td>
                </tr>
              ) : posts.length ? (
                posts.map((post) => (
                  <tr key={post.id}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                          {post.thumbnailUrl ? (
                            <img
                              src={post.thumbnailUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Newspaper className="m-3 size-6 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {post.title}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            /blogs/{post.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-smaller text-slate-600 dark:text-slate-300">
                      {post.category}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          post.status === "published"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-smaller text-slate-500">
                      {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(post)}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-500 hover:text-primary"
                          title="Edit"
                        >
                          <Edit3 className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(post)}
                          className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    No blog posts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isEditorOpen && (
        <div className="fixed inset-0 z-100 bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="mx-auto max-w-5xl rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-h5 font-black text-slate-900 dark:text-white">
                  {editingPost ? "Edit Blog Post" : "Create Blog Post"}
                </h2>
                <p className="text-smaller text-slate-500">
                  Use markdown content with images from Cloudinary.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2">
                  <span className="block text-smaller font-semibold">Title</span>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                    required
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-1 ring-primary"
                  />
                </label>
                <label className="space-y-2">
                  <span className="block text-smaller font-semibold">
                    Category
                  </span>
                  <input
                    value={form.category}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        category: event.target.value,
                      }))
                    }
                    required
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-1 ring-primary"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
                <label className="space-y-2">
                  <span className="block text-smaller font-semibold">
                    Thumbnail URL
                  </span>
                  <div className="flex gap-2">
                    <input
                      value={form.thumbnailUrl}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          thumbnailUrl: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-1 ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setIsMediaOpen(true)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-smaller font-bold text-primary"
                    >
                      <ImagePlus className="size-4" />
                      Pick
                    </button>
                  </div>
                </label>
                <label className="space-y-2">
                  <span className="block text-smaller font-semibold">Status</span>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        status: event.target.value as BlogStatus,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-1 ring-primary"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </label>
              </div>

              {form.thumbnailUrl && (
                <img
                  src={form.thumbnailUrl}
                  alt=""
                  className="h-40 w-full rounded-lg object-cover border border-slate-200 dark:border-slate-800"
                />
              )}

              <MarkdownField
                value={form.content}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, content: value }))
                }
                label="Content"
                placeholder="Write blog content..."
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-smaller font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-5 py-2 text-smaller font-bold text-white disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MediaLibraryModal
        isOpen={isMediaOpen}
        onClose={() => setIsMediaOpen(false)}
        onSelect={(url) => {
          setForm((prev) => ({ ...prev, thumbnailUrl: url }));
          setIsMediaOpen(false);
        }}
      />
    </div>
  );
}
