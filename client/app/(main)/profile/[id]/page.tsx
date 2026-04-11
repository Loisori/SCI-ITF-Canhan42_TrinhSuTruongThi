"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";
import api from "@/lib/axios";
import { UserProfile } from "@/types/user";
import { 
  Briefcase, 
  Calendar, 
  Mail, 
  MapPin, 
  Layout,
  Webhook,
  Activity,
  Rocket,
  TrendingUp
} from "lucide-react";
import Link from "next/link";

export default function PublicProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [createdProjects, setCreatedProjects] = useState<any[]>([]);
  const [investedProjects, setInvestedProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [profileRes, createdRes, investedRes] = await Promise.all([
          api.get<UserProfile>(`/api/users/${id}/public`),
          api.get(`/api/projects/user/${id}/created?pageSize=100`),
          api.get(`/api/projects/user/${id}/invested`)
        ]);
        
        setProfile(profileRes.data);
        setCreatedProjects(createdRes.data?.items || createdRes.data || []);
        setInvestedProjects(investedRes.data || []);
      } catch (err) {
        console.error("Failed to fetch public profile data:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfileData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <Navbar />
        <main className="container mx-auto px-4 py-20 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <Navbar />
        <main className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-h3 font-bold">Người dùng không tồn tại</h1>
          <p className="text-slate-500 mt-2">Hồ sơ bạn đang tìm kiếm không khả dụng.</p>
        </main>
        <Footer />
      </div>
    );
  }

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
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header Section */}
          <div className="relative">
            {/* Cover Photo */}
            <div className="h-48 md:h-80 rounded-[2.5rem] overflow-hidden bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative">
              {profile.coverPhotoUrl ? (
                <img 
                  src={profile.coverPhotoUrl} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 opacity-10 flex items-center justify-center">
                    <Layout className="size-32" />
                </div>
              )}
            </div>

            {/* Profile Info Bar */}
            <div className="px-6 md:px-12 -mt-16 flex flex-col md:flex-row md:items-end gap-6 relative z-10">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                {/* Avatar */}
                <div className="size-32 md:size-40 rounded-full border-4 border-white dark:border-slate-950 shadow-2xl overflow-hidden bg-white dark:bg-slate-900 shrink-0">
                  <img 
                    src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=random`} 
                    alt={profile.fullName} 
                    className="size-full object-cover"
                  />
                </div>
                {/* Name & Role */}
                <div className="text-center md:text-left mb-4">
                  <h1 className="text-h2 md:text-h1 font-black text-slate-900 dark:text-white tracking-tight">
                    {profile.fullName}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-small font-black uppercase tracking-tighter">
                      <Briefcase size={14} />
                      {profile.role?.toLowerCase() === 'investor' ? 'Nhà đầu tư' : 'Chủ dự án'}
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500 text-small font-bold">
                      <Calendar size={14} />
                      Tham gia từ {joinedDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12 px-2">
            {/* Left Column: Stats & Social */}
            <div className="space-y-8">
              {/* Basic Info */}
              <div className="p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Mail size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email liên hệ</p>
                      <p className="text-small font-bold text-slate-700 dark:text-slate-300">{profile.email || "Private"}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center text-rose-600">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Địa điểm</p>
                      <p className="text-small font-bold text-slate-700 dark:text-slate-300">Việt Nam</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                      <Activity size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</p>
                      <p className="text-small font-bold text-slate-700 dark:text-slate-300">Hoạt động</p>
                    </div>
                 </div>
              </div>

              {/* Social Links Section */}
              <div className="p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-small font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                  Kết nối
                </h3>
                <div className="space-y-3">
                  {socialLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.url ? (link.url.startsWith('http') ? link.url : `https://${link.url}`) : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-between px-5 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all font-bold group ${!link.url && 'pointer-events-none opacity-40'}`}
                    >
                      <div className="flex items-center gap-3">
                        <link.icon className={`size-5 text-slate-400 ${link.color} transition-colors`} />
                        <span className="text-small text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">{link.name}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Bio & Projects */}
            <div className="lg:col-span-2 space-y-12">
              {/* Bio Section */}
              <section className="p-10 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm min-h-[20rem]">
                <h3 className="text-h4 font-black text-slate-900 dark:text-white mb-8">
                  Giới thiệu
                </h3>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    {profile.bio || "Người dùng này chưa cập nhật tiểu sử bản thân."}
                  </p>
                </div>
              </section>

              {/* Projects Created Section */}
              {createdProjects.length > 0 && (
                <section className="space-y-8">
                  <h3 className="text-h3 font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <Rocket className="size-8 text-primary" />
                    Dự án đã tạo
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {createdProjects.map((project) => (
                      <Link 
                        key={project.id}
                        href={`/projects/${project.slug}`}
                        className="group p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-primary/50 transition-all hover:shadow-xl flex gap-6 items-center"
                      >
                         <div className="size-24 rounded-2xl overflow-hidden shrink-0">
                            <img 
                              src={project.thumbnailUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(project.title)}&background=random`} 
                              alt={project.title} 
                              className="size-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            />
                         </div>
                         <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 block">
                              {project.category?.name || "Khác"}
                            </span>
                            <h4 className="text-h5 font-bold text-slate-900 dark:text-white truncate mb-2 group-hover:text-primary transition-colors">
                              {project.title}
                            </h4>
                            <div className="flex items-center gap-3">
                               <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-500">
                                 {project.status}
                               </span>
                            </div>
                         </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Projects Invested Section */}
              {investedProjects.length > 0 && (
                <section className="space-y-8">
                  <h3 className="text-h3 font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <TrendingUp className="size-8 text-emerald-500" />
                    Dự án đã đầu tư
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {investedProjects.map((project) => (
                      <Link 
                        key={project.id}
                        href={`/projects/${project.slug}`}
                        className="group p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-primary/50 transition-all hover:shadow-xl flex gap-6 items-center"
                      >
                         <div className="size-24 rounded-2xl overflow-hidden shrink-0">
                            <img 
                              src={project.thumbnailUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(project.title)}&background=random`} 
                              alt={project.title} 
                              className="size-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            />
                         </div>
                         <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                               <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">
                                 Investment
                               </span>
                               <span className="text-small font-black text-primary">
                                 {project.fundingProgress}%
                               </span>
                            </div>
                            <h4 className="text-h5 font-bold text-slate-900 dark:text-white truncate mb-2 group-hover:text-primary transition-colors">
                              {project.title}
                            </h4>
                            <p className="text-[10px] font-bold text-slate-400 truncate">
                              Bởi {project.owner?.fullName}
                            </p>
                         </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
