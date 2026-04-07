"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { UserProfile } from "@/types/user";
import toast from "react-hot-toast";

export default function SettingsView({ profile, onUpdate }: { profile: UserProfile, onUpdate: () => void }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);

  const [notifSettings, setNotifSettings] = useState<Record<string, boolean>>(profile.notificationSettings || {
    email: true,
    push: true,
    investment_update: true,
    milestone_reached: true,
  });

  const handleToggleNotif = async (key: string) => {
    const newVal = !notifSettings[key];
    const updated = { ...notifSettings, [key]: newVal };
    setNotifSettings(updated);

    try {
      await api.patch("/api/users/notification-settings", { [key]: newVal });
      toast.success("Đã cập nhật cài đặt thông báo");
    } catch (err) {
      toast.error("Không thể cập nhật cài đặt");
      setNotifSettings(notifSettings); // revert
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới không khớp");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }

    try {
      setIsChangingPass(true);
      await api.patch("/api/users/change-password", { oldPassword, newPassword });
      toast.success("Đổi mật khẩu thành công");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Mật khẩu cũ không chính xác");
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-h3 font-bold text-slate-900 dark:text-white">Cài đặt</h1>
        <p className="text-slate-600 dark:text-slate-400 text-body mt-1">Quản lý hồ sơ và tùy chọn thông báo của bạn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Security / Password */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
             <span className="material-symbols-outlined text-primary">lock_reset</span>
             Đổi mật khẩu
          </h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Mật khẩu cũ</label>
              <input 
                type="password" 
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-smaller outline-none focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Mật khẩu mới</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-smaller outline-none focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Nhập lại mật khẩu mới</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-smaller outline-none focus:border-primary transition-all"
              />
            </div>
            <button 
              disabled={isChangingPass}
              type="submit"
              className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-smaller hover:shadow-md transition-all disabled:opacity-50"
            >
              Cập nhật mật khẩu
            </button>
          </form>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
             <span className="material-symbols-outlined text-primary">notifications_active</span>
             Tùy chọn thông báo
          </h3>
          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div>
                  <p className="text-smaller font-bold text-slate-900 dark:text-white">Email thông báo</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Nhận các bản cập nhật qua địa chỉ email của bạn.</p>
                </div>
                <button 
                  onClick={() => handleToggleNotif("email")}
                  className={`size-10 rounded-full flex items-center justify-center transition-all ${notifSettings.email ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}
                >
                  <span className="material-symbols-outlined">{notifSettings.email ? 'toggle_on' : 'toggle_off'}</span>
                </button>
             </div>
             
             <div className="flex items-center justify-between">
                <div>
                  <p className="text-smaller font-bold text-slate-900 dark:text-white">Thông báo đẩy (Push)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Nhận thông báo tức thì trên ứng dụng.</p>
                </div>
                <button 
                   onClick={() => handleToggleNotif("push")}
                   className={`size-10 rounded-full flex items-center justify-center transition-all ${notifSettings.push ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}
                >
                  <span className="material-symbols-outlined">{notifSettings.push ? 'toggle_on' : 'toggle_off'}</span>
                </button>
             </div>

             <div className="flex items-center justify-between">
                <div>
                  <p className="text-smaller font-bold text-slate-900 dark:text-white">Cập nhật đầu tư</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Thông báo về việc thay đổi trạng thái giao dịch.</p>
                </div>
                <button 
                   onClick={() => handleToggleNotif("investment_update")}
                   className={`size-10 rounded-full flex items-center justify-center transition-all ${notifSettings.investment_update ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}
                >
                  <span className="material-symbols-outlined">{notifSettings.investment_update ? 'toggle_on' : 'toggle_off'}</span>
                </button>
             </div>

             <div className="flex items-center justify-between">
                <div>
                  <p className="text-smaller font-bold text-slate-900 dark:text-white">Giai đoạn dự án</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Thông báo khi dự án tiến tới cột mốc mới.</p>
                </div>
                <button 
                   onClick={() => handleToggleNotif("milestone_reached")}
                   className={`size-10 rounded-full flex items-center justify-center transition-all ${notifSettings.milestone_reached ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}
                >
                  <span className="material-symbols-outlined">{notifSettings.milestone_reached ? 'toggle_on' : 'toggle_off'}</span>
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
