"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";
import api from "@/lib/axios";
import { SettingsCategoryRef, SettingsUser } from "@/types/settings";
import { toast } from "sonner";

export default function SettingsPage() {
  const [user, setUser] = useState<SettingsUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("account");

  // Avatar states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Category states
  const [categories, setCategories] = useState<SettingsCategoryRef[]>([]);
  const [favoriteCategoryIds, setFavoriteCategoryIds] = useState<number[]>([]);
  const [blacklistCategoryIds, setBlacklistCategoryIds] = useState<number[]>([]);

  // Password states
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const [profileRes, catRes] = await Promise.all([
          api.get<SettingsUser>("/api/users/profile"),
          api.get<SettingsCategoryRef[]>("/api/project-categories"),
        ]);

        const curUser = profileRes.data;
        setUser(curUser);
        setCategories(catRes.data);

        if (curUser.favoriteCategories) {
          setFavoriteCategoryIds(curUser.favoriteCategories.map((c) => c.id));
        }
        if (curUser.blacklistCategories) {
          setBlacklistCategoryIds(curUser.blacklistCategories.map((c) => c.id));
        }

        setLoading(false);
      } catch {
        setLoading(false);
        router.push("/login");
      }
    };

    fetchUserProfile();
  }, [router]);

  // Avatar handlers
  const handleAvatarSelect = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant Preview
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    setIsUploadingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.patch("/api/users/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser((prev) => (prev ? { ...prev, avatarUrl: res.data.avatarUrl } : null));
      toast.success("Cập nhật ảnh đại diện thành công!");
      
      // Global Sync
      window.dispatchEvent(new Event("auth-changed"));
    } catch (err) {
      toast.error("Không thể tải ảnh lên. Vui lòng thử lại.");
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Password handlers
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword.length < 8) {
      toast.error("Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("Xác nhận mật khẩu không khớp");
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.patch("/api/users/change-password", {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
      });
      toast.success("Đổi mật khẩu thành công!");
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Đổi mật khẩu thất bại";
      toast.error(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Category handlers
  const togglePreference = async (categoryId: number, type: "favorite" | "blacklist") => {
    try {
      // Optimistic UI Update
      if (type === "favorite") {
        setFavoriteCategoryIds((prev) =>
          prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
        );
        setBlacklistCategoryIds((prev) => prev.filter((id) => id !== categoryId));
      } else {
        setBlacklistCategoryIds((prev) =>
          prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
        );
        setFavoriteCategoryIds((prev) => prev.filter((id) => id !== categoryId));
      }

      await api.patch(`/api/users/preferences/category/${categoryId}/toggle?type=${type}`);
      
      const label = type === "favorite" ? "yêu thích" : "không quan tâm";
      toast.success(`Đã cập nhật danh mục ${label}`);
    } catch (err) {
      toast.error("Lỗi khi cập nhật danh mục");
      // Revert if failed (simple refetch for consistency or manual revert)
    }
  };

  if (loading) {
    return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
        <Navbar />
        <main className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Đang tải...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />
      <main className="wrapper wrapper--lg py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-smaller text-slate-600 dark:text-slate-400 mb-8">
          <Link href="/dashboard" className="hover:text-primary transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-semibold">Cài đặt</span>
        </div>

        {/* Page Header */}
        <section className="mb-12">
          <h1 className="text-h3 font-bold text-slate-900 dark:text-white mb-2">
            Cài đặt tài khoản
          </h1>
          <p className="text-body text-slate-600 dark:text-slate-400">
            Quản lý thông tin cá nhân và cài đặt tài khoản của bạn
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <nav className="space-y-2 sticky top-20">
              {[
                { id: "account", label: "Thông tin tài khoản" },
                { id: "password", label: "Đổi mật khẩu" },
                { id: "categories", label: "Sở thích & Loại trừ" },
                { id: "privacy", label: "Quyền riêng tư" },
                { id: "notifications", label: "Thông báo" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-2 rounded-lg text-smaller font-semibold transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary text-white"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <section className="lg:col-span-3 p-0!">
            {/* Account Settings Tab */}
            {activeTab === "account" && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
                <h2 className="text-h5 font-bold text-slate-900 dark:text-white mb-8">
                  Thông tin tài khoản
                </h2>

                <div className="space-y-8">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/10">
                        <img
                          src={avatarPreview || user?.avatarUrl || "/images/default-avatar.png"}
                          alt="Avatar"
                          className={`w-full h-full object-cover transition-opacity ${isUploadingAvatar ? 'opacity-50' : 'opacity-100'}`}
                        />
                      </div>
                      {isUploadingAvatar && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-smaller font-bold text-slate-900 dark:text-white mb-2">Ảnh đại diện</h3>
                      <div className="flex gap-3">
                        <button
                          onClick={handleAvatarSelect}
                          disabled={isUploadingAvatar}
                          className="px-4 py-1.5 bg-primary text-white text-smallest font-bold rounded-lg hover:opacity-90 transition-opacity"
                        >
                          Thay đổi ảnh
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleAvatarChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2">Dung lượng tối đa 2MB. Định dạng: JPG, PNG, WEBP.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-smaller font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Tên đầy đủ
                      </label>
                      <input
                        type="text"
                        value={user?.fullName || ""}
                        readOnly
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 text-smaller"
                      />
                    </div>
                    <div>
                      <label className="block text-smaller font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={user?.email || ""}
                        readOnly
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 text-smaller"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-smaller font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Vai trò
                    </label>
                    <div className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-smaller">
                      <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-bold">
                        {user?.role === "INVESTOR" ? "Nhà đầu tư" : user?.role || "Đang tải..."}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === "password" && (
              <form onSubmit={handlePasswordChange} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
                <h2 className="text-h5 font-bold text-slate-900 dark:text-white mb-6">
                  Đổi mật khẩu
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-smaller font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      required
                      value={passwords.oldPassword}
                      onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                      placeholder="Nhập mật khẩu hiện tại"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-smaller focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-smaller font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      required
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      placeholder="Nhập mật khẩu mới"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-smaller focus:outline-none focus:border-primary"
                    />
                    {passwords.newPassword && passwords.newPassword.length < 8 && (
                      <p className="text-[11px] text-red-500 mt-1 font-semibold">Mật khẩu phải có ít nhất 8 ký tự</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-smaller font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      type="password"
                      required
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      placeholder="Xác nhận mật khẩu mới"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-smaller focus:outline-none focus:border-primary"
                    />
                    {passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
                      <p className="text-[11px] text-red-500 mt-1 font-semibold">Mật khẩu xác nhận không khớp</p>
                    )}
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-70 text-smaller"
                    >
                      {isChangingPassword ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Categories Tab */}
            {activeTab === "categories" && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
                <h2 className="text-h5 font-bold text-slate-900 dark:text-white mb-2">
                  Sở thích đầu tư
                </h2>
                <p className="text-smallest text-slate-500 mb-8 italic">* Các thay đổi sẽ được lưu tự động sau mỗi lần nhấn.</p>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-smaller font-semibold text-slate-700 dark:text-slate-300 mb-4">Danh mục yêu thích</h3>
                    <div className="flex flex-wrap gap-3">
                      {categories.map((category) => {
                        const isSelected = favoriteCategoryIds.includes(category.id);
                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => togglePreference(category.id, "favorite")}
                            className={`px-4 py-2 rounded-full border text-smallest font-bold transition-all transform hover:scale-105 active:scale-95 ${
                              isSelected
                                ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50"
                            }`}
                          >
                            {category.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-smaller font-semibold text-slate-700 dark:text-slate-300 mb-4">Danh mục không quan tâm (Loại trừ)</h3>
                    <div className="flex flex-wrap gap-3">
                      {categories.map((category) => {
                        const isSelected = blacklistCategoryIds.includes(category.id);
                        return (
                          <button
                            key={"bl_" + category.id}
                            type="button"
                            onClick={() => togglePreference(category.id, "blacklist")}
                            className={`px-4 py-2 rounded-full border text-smallest font-bold transition-all transform hover:scale-105 active:scale-95 ${
                              isSelected
                                ? "bg-red-500 border-red-500 text-white shadow-md shadow-red-500/20"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-red-500/50"
                            }`}
                          >
                            {category.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs simplified for space */}
            {(activeTab === "privacy" || activeTab === "notifications") && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center py-20">
                <span className="material-symbols-outlined text-h1 text-slate-200 mb-4">construction</span>
                <p className="text-slate-500">Chắt năng này đang được phát triển.</p>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
