"use client";

//services
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { MediaItem, MediaLibraryModalProps } from "@/types/media";

export default function MediaLibraryModal({ isOpen, onClose, onSelect }: MediaLibraryModalProps) {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await api.get<MediaItem[]>("/api/media");
      setMediaList(res.data);
    } catch (err) {
      setError("Không thể tải thư viện hình ảnh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void fetchMedia();
    }
  }, [isOpen]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/api/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchMedia(); // Refresh list after upload
    } catch (err: any) {
      setError(err.response?.data?.message || "Lỗi tải ảnh lên.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent selecting
    if (!confirm("Bạn có chắc chắn muốn xóa ảnh này khỏi thư viện?")) return;

    try {
      await api.delete(`/api/media/${id}`);
      setMediaList((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      alert("Lỗi xóa ảnh: " + (err.response?.data?.message || err.message));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-h5 font-bold">Thư viện của tôi</h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 relative">
          
          {/* Upload Button */}
          <div className="mb-6 flex gap-4 items-center">
            <label className="bg-primary text-white font-bold py-2 px-6 rounded-xl cursor-pointer hover:bg-primary-dark transition shadow-lg shadow-primary/30">
              {uploading ? "Đang tải ảnh lên..." : "+ Tải ảnh mới lên Cloudinary"}
              <input type="file" className="hidden" accept="image/*,video/*" onChange={handleUpload} disabled={uploading} />
            </label>
            {error && <span className="text-red-500 font-medium text-small">{error}</span>}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20 text-slate-500">Đang tải cấu hình thư viện...</div>
          ) : mediaList.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500">
              Bạn chưa có tấm ảnh nào trong Thư viện. Hãy tải lên ngay!
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {mediaList.map((media) => (
                <div 
                  key={media.id} 
                  className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-primary transition"
                  onClick={() => onSelect(media.url)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={media.url} alt={media.fileName} className="w-full h-full object-cover" />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none">
                    <span className="text-white font-bold text-small bg-primary/90 px-3 py-1.5 rounded-lg">Chọn ảnh này</span>
                  </div>

                  <button 
                    onClick={(e) => handleDelete(media.id, e)}
                    title="Xóa ảnh"
                    className="absolute top-2 right-2 bg-red-600/90 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-500 z-10"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
