"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/axios";
import { UserProfile } from "@/types/user";
import { SettingsCategoryRef, SettingsUser } from "@/types/settings";
import toast from "react-hot-toast";
import { User, Lock, Star, Bell, Check, X, ToggleRight, ToggleLeft, Link as LinkIcon, Webhook, Save, UserCircle, Mail } from "lucide-react";
import { useForm } from "react-hook-form";

export default function SettingsView({ profile, onUpdate }: { profile: UserProfile, onUpdate: () => void }) {
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

  // Notification states
  const [notifSettings, setNotifSettings] = useState<Record<string, boolean>>(profile.notificationSettings || {
    investment_update: true,
    milestone_reached: true,
  });

  // React Hook Form for Profile & Social Links
  const { register, handleSubmit, reset, formState: { isSubmitting, isDirty } } = useForm({
    defaultValues: {
      fullName: profile.fullName,
      bio: profile.bio || "",
      facebook: profile.socialLinks?.facebook || "",
      linkedin: profile.socialLinks?.linkedin || "",
      twitter: profile.socialLinks?.twitter || "",
      github: profile.socialLinks?.github || "",
    }
  });

  useEffect(() => {
    if (user) {
        reset({
            fullName: user.fullName,
            bio: user.bio || "",
            facebook: user.socialLinks?.facebook || "",
            linkedin: user.socialLinks?.linkedin || "",
            twitter: user.socialLinks?.twitter || "",
            github: user.socialLinks?.github || "",
        });
    }
  }, [user, reset]);

  const onUpdateProfile = async (data: any) => {
    try {
      const payload = {
        fullName: data.fullName,
        bio: data.bio,
        socialLinks: {
          facebook: data.facebook,
          linkedin: data.linkedin,
          twitter: data.twitter,
          github: data.github,
        }
      };
      
      const res = await api.patch("/api/users/profile", payload);
      setUser(prev => prev ? { ...prev, ...res.data } : null);
      toast.success("Cập nhật thông tin thành công!");
      onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể cập nhật hồ sơ");
    }
  };

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
      }
    };

    fetchUserProfile();
  }, []);

  // Avatar handlers
  const handleAvatarSelect = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      onUpdate();
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
    }
  };

  // Notification handlers
  const handleToggleNotif = async (key: string) => {
    const newVal = !notifSettings[key];
    const updated = { ...notifSettings, [key]: newVal };
    setNotifSettings(updated);

    try {
      await api.patch("/api/users/notification-settings", { [key]: newVal });
      toast.success("Đã cập nhật cài đặt thông báo");
    } catch (err) {
      toast.error("Không thể cập nhật cài đặt");
      setNotifSettings(notifSettings);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-h3 font-bold text-slate-900 dark:text-white">Cài đặt tài khoản</h1>
        <p className="text-slate-600 dark:text-slate-400 text-body mt-1">
          Quản lý thông tin cá nhân và cài đặt tài khoản của bạn
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:w-64 shrink-0 border-slate-200 dark:border-slate-800">
          <nav className="space-y-2 sticky top-20">
            {[
              { id: "account", label: "Thông tin", icon: User },
              { id: "links", label: "Liên kết", icon: LinkIcon },
              { id: "password", label: "Đổi mật khẩu", icon: Lock },
              { id: "categories", label: "Sở thích", icon: Star },
              { id: "notifications", label: "Thông báo", icon: Bell },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-smaller font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <tab.icon className="text-base" />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Account Settings Tab */}
          {activeTab === "account" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <h2 className="text-h5 font-bold text-slate-900 dark:text-white mb-8">
                Thông tin tài khoản
              </h2>

              <div className="space-y-8">
                {/* Avatar Section */}
                <div className="flex flex-wrap items-center gap-6">
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
                        className="px-4 py-2 bg-primary/10 text-primary text-smallest font-bold rounded-xl hover:bg-primary/20 transition-colors"
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

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-smaller font-semibold text-slate-700 dark:text-slate-300 mb-2">
                       Họ và tên
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                        <UserCircle size={18} />
                      </div>
                      <input
                        {...register("fullName")}
                        type="text"
                        placeholder="Nhập họ tên đầy đủ"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-smaller outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-smaller font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Email
                    </label>
                    <div className="relative">
                       <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Mail size={18} />
                      </div>
                      <input
                        type="email"
                        value={user?.email || profile.email || ""}
                        readOnly
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 text-smaller outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-smaller font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Tiểu sử (Bio)
                    </label>
                    <textarea
                      {...register("bio")}
                      rows={4}
                      placeholder="Giới thiệu ngắn gọn về bản thân..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-smaller outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                   <button
                    onClick={handleSubmit(onUpdateProfile)}
                    disabled={isSubmitting || !isDirty}
                    className="flex items-center gap-2 px-8 py-3 bg-primary text-white text-smaller font-bold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:shadow-none"
                   >
                     {isSubmitting ? "Đang lưu..." : <><Save size={18} /> Lưu thay đổi</>}
                   </button>
                </div>

                <div>
                  <label className="block text-smaller font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Vai trò
                  </label>
                  <div className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-smaller">
                    <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-bold">
                      {user?.role === "INVESTOR" || profile.role === "investor" ? "Nhà đầu tư" : user?.role || profile.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Social Links Tab */}
          {activeTab === "links" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <h2 className="text-h5 font-bold text-slate-900 dark:text-white mb-2">
                Liên kết mạng xã hội
              </h2>
              <p className="text-smaller text-slate-500 mb-8">Kết nối các tài khoản mạng xã hội để người khác dễ dàng tìm thấy bạn.</p>

              <form onSubmit={handleSubmit(onUpdateProfile)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {[
                    { id: "facebook", label: "Facebook", icon: Webhook, color: "text-blue-600", placeholder: "facebook.com/username" },
                    { id: "linkedin", label: "LinkedIn", icon: Webhook, color: "text-blue-700", placeholder: "linkedin.com/in/username" },
                    { id: "twitter", label: "Twitter (X)", icon: Webhook, color: "text-sky-500", placeholder: "twitter.com/username" },
                    { id: "github", label: "GitHub", icon: Webhook, color: "text-slate-900 dark:text-white", placeholder: "github.com/username" },
                  ].map((field) => (
                    <div key={field.id}>
                      <label className="block text-smaller font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        {field.label}
                      </label>
                      <div className="relative group">
                        <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${field.color}`}>
                          <field.icon size={18} />
                        </div>
                        <input
                          {...register(field.id as any)}
                          type="text"
                          placeholder={field.placeholder}
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-smaller outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                   <button
                    type="submit"
                    disabled={isSubmitting || !isDirty}
                    className="flex items-center gap-2 px-8 py-3 bg-primary text-white text-smaller font-bold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:shadow-none"
                   >
                     {isSubmitting ? "Đang lưu..." : <><Save size={18} /> Lưu thay đổi</>}
                   </button>
                </div>
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <h2 className="text-h5 font-bold text-slate-900 dark:text-white mb-6">
                Đổi mật khẩu
              </h2>

              <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    required
                    value={passwords.oldPassword}
                    onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-smaller outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    required
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-smaller outline-none focus:border-primary transition-all"
                  />
                  {passwords.newPassword && passwords.newPassword.length < 8 && (
                    <p className="text-[11px] text-red-500 mt-1 font-semibold">Mật khẩu phải có ít nhất 8 ký tự</p>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    required
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-smaller outline-none focus:border-primary transition-all"
                  />
                  {passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
                    <p className="text-[11px] text-red-500 mt-1 font-semibold">Mật khẩu xác nhận không khớp</p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-smaller hover:shadow-md transition-all disabled:opacity-50"
                  >
                    {isChangingPassword ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === "categories" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <h2 className="text-h5 font-bold text-slate-900 dark:text-white mb-2">
                Sở thích đầu tư
              </h2>
              <p className="text-[11px] text-slate-500 mb-8 italic">* Các thay đổi sẽ được lưu tự động sau mỗi lần nhấn.</p>

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
                          className={`px-4 py-2 flex items-center gap-2 rounded-xl text-smallest font-bold transition-all border ${
                            isSelected
                              ? "bg-primary/20 border-primary text-primary"
                              : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-primary/50"
                          }`}
                        >
                          {isSelected && <Check className="text-[14px]" />}
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
                          className={`px-4 py-2 rounded-xl flex items-center gap-2 text-smallest font-bold transition-all border ${
                            isSelected
                              ? "bg-red-500/10 border-red-500 text-red-600 dark:text-red-400"
                              : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-red-500/50"
                          }`}
                        >
                          {isSelected && <X className="text-[14px]" />}
                          {category.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <h2 className="text-h5 font-bold text-slate-900 dark:text-white mb-6">
                Tùy chọn thông báo
              </h2>
              
              <div className="space-y-6 max-w-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-smaller font-bold text-slate-900 dark:text-white">Email thông báo</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Nhận các bản cập nhật qua địa chỉ email của bạn.</p>
                  </div>
                  <button 
                    onClick={() => handleToggleNotif("email")}
                    className={`size-10 rounded-full flex items-center justify-center transition-all ${notifSettings.email ? 'bg-primary/20 text-primary' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}
                  >
                    {notifSettings.email ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-smaller font-bold text-slate-900 dark:text-white">Thông báo đẩy (Push)</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Nhận thông báo tức thì trên ứng dụng.</p>
                  </div>
                  <button 
                      onClick={() => handleToggleNotif("push")}
                      className={`size-10 rounded-full flex items-center justify-center transition-all ${notifSettings.push ? 'bg-primary/20 text-primary' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}
                  >
                    {notifSettings.push ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-smaller font-bold text-slate-900 dark:text-white">Cập nhật đầu tư</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Thông báo về việc thay đổi trạng thái giao dịch.</p>
                  </div>
                  <button 
                      onClick={() => handleToggleNotif("investment_update")}
                      className={`size-10 rounded-full flex items-center justify-center transition-all ${notifSettings.investment_update ? 'bg-primary/20 text-primary' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}
                  >
                    {notifSettings.investment_update ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-smaller font-bold text-slate-900 dark:text-white">Giai đoạn dự án</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Thông báo khi dự án tiến tới cột mốc mới.</p>
                  </div>
                  <button 
                      onClick={() => handleToggleNotif("milestone_reached")}
                      className={`size-10 rounded-full flex items-center justify-center transition-all ${notifSettings.milestone_reached ? 'bg-primary/20 text-primary' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}
                  >
                    {notifSettings.milestone_reached ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
