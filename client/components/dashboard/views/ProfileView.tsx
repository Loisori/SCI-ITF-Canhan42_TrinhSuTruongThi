"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { UserProfile } from "@/types/user";
import { formatVnd } from "@/lib/utils";
import { 
  Briefcase, 
  Calendar, 
  Mail, 
  MapPin, 
  Settings, 
  Wallet,
  TrendingUp,
  Layout,
  Webhook,
  ArrowUpRight,
  ChevronRight,
  Rocket
} from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import Link from "next/link";

export default function ProfileView({ profile }: { profile: UserProfile }) {
  const { setActiveView } = useDashboard();
  const [investedProjects, setInvestedProjects] = useState<any[]>([]);
  const [createdProjects, setCreatedProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [investedRes, createdRes] = await Promise.all([
          api.get(`/api/projects/user/${profile.id}/invested`),
          api.get(`/api/projects/user/${profile.id}/created?pageSize=100`)
        ]);
        setInvestedProjects(investedRes.data || []);
        setCreatedProjects(createdRes.data?.items || createdRes.data || []);
      } catch (err) {
        console.error("Failed to fetch profile projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [profile.id]);

  const joinedDate = new Date(profile.createdAt).toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });

  const socialLinks = [
    { name: "Facebook", icon: Webhook, url: profile.socialLinks?.facebook, color: "hover:text-blue-600" },
    { name: "LinkedIn", icon: Webhook, url: profile.socialLinks?.linkedin, color: "hover:text-blue-700" },
    { name: "Twitter", icon: Webhook, url: profile.socialLinks?.twitter, color: "hover:text-sky-500" },
    { name: "GitHub", icon: Webhook, url: profile.socialLinks?.github, color: "hover:text-slate-900 dark:hover:text-white" },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      {/* Header Section */}
      <div className="relative group">
        {/* Cover Photo */}
        <div className="h-48 md:h-64 rounded-3xl overflow-hidden bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative">
          {profile.coverPhotoUrl ? (
            <img 
              src={profile.coverPhotoUrl} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
                <Layout className="size-24" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>

        {/* Profile Info Bar */}
        <div className="px-6 md:px-10 -mt-12 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
            {/* Avatar */}
            <div className="size-28 md:size-32 rounded-full border-4 border-white dark:border-slate-950 shadow-xl overflow-hidden bg-white dark:bg-slate-900 flex-shrink-0">
              <img 
                src={profile.avatarUrl || "/images/default-avatar.png"} 
                alt={profile.fullName} 
                className="size-full object-cover"
              />
            </div>
            {/* Name & Role */}
            <div className="text-center md:text-left mb-2">
              <h1 className="text-h3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {profile.fullName}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-smallest font-bold capitalize">
                  <Briefcase size={12} />
                  {profile.role.toLowerCase() === 'investor' ? 'Nhà đầu tư' : 'Chủ dự án'}
                </span>
                <span className="flex items-center gap-1.5 text-slate-500 text-smallest font-medium">
                  <Calendar size={12} />
                  Tham gia {joinedDate}
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setActiveView("settings")}
            className="mb-2 px-6 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-smaller font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
          >
            <Settings size={16} />
            Chỉnh sửa hồ sơ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12 px-2">
        {/* Left Column: Stats & Social */}
        <div className="space-y-8">
          {/* Stats Section */}
          <div className="grid grid-cols-1 gap-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Ví tài sản</span>
                <Wallet className="size-5 text-emerald-500" />
              </div>
              <p className="text-h4 font-bold text-slate-900 dark:text-white">{formatVnd(Number(profile.balance || 0))}</p>
              <p className="text-[11px] text-slate-400 mt-1">Số dư khả dụng</p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                  {profile.role.toLowerCase() === 'owner' ? 'Dự án đã tạo' : 'Đầu tư'}
                </span>
                <TrendingUp className="size-5 text-primary" />
              </div>
              <p className="text-h4 font-bold text-slate-900 dark:text-white">
                {profile.role.toLowerCase() === 'owner' ? createdProjects.length : investedProjects.length}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {profile.role.toLowerCase() === 'owner' ? 'Dự án đã đăng tải' : 'Dự án đã tham gia'}
              </p>
            </div>
          </div>

          {/* Social Links Section */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-smaller font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-widest flex items-center gap-2">
              Liên kết cộng đồng
            </h3>
            <div className="space-y-3">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url ? (link.url.startsWith('http') ? link.url : `https://${link.url}`) : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all font-semibold group ${!link.url && 'pointer-events-none opacity-40'}`}
                >
                  <div className="flex items-center gap-3">
                    <link.icon className={`size-5 text-slate-400 ${link.color} transition-colors`} />
                    <span className="text-smaller text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">{link.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 group-hover:text-primary transition-colors">
                    {link.url ? 'Truy cập' : 'Chưa thiết lập'}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Bio & More */}
        <div className="lg:col-span-2 space-y-8">
          {/* Bio Section */}
          <section className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm min-h-[16rem]">
            <h3 className="text-h5 font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              Giới thiệu
            </h3>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-body">
                {profile.bio || "Người dùng này chưa cập nhật tiểu sử bản thân."}
              </p>
            </div>
          </section>

          {/* Project Sections */}
          {(createdProjects.length > 0 || investedProjects.length > 0) && (
            <div className="space-y-12">
              {createdProjects.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-h5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Rocket className="size-5 text-primary" />
                      Dự án đã tạo
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {createdProjects.map((project) => (
                      <Link 
                        key={project.id}
                        href={`/projects/${project.slug}`}
                        className="group flex gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all hover:shadow-md"
                      >
                        <div className="size-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                          <img 
                            src={project.thumbnailUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(project.title)}&background=random`} 
                            alt={project.title} 
                            className="size-full object-cover group-hover:scale-110 transition-transform" 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-smaller font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                            {project.title}
                          </h4>
                          <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 mt-1">
                            {project.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {investedProjects.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-h5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="size-5 text-emerald-500" />
                      Dự án đã đầu tư
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {investedProjects.map((project) => (
                      <Link 
                        key={project.id}
                        href={`/projects/${project.slug}`}
                        className="group flex gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all hover:shadow-md"
                      >
                        <div className="size-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                          <img 
                            src={project.thumbnailUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(project.title)}&background=random`} 
                            alt={project.title} 
                            className="size-full object-cover group-hover:scale-110 transition-transform" 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-smaller font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                            {project.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                              {project.fundingProgress}%
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">
                              Bởi {project.owner?.fullName}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
