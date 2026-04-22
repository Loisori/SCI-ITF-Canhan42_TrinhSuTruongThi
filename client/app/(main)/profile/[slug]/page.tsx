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
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import ProjectCard from "@/components/client/ProjectCard";

export default function PublicProfilePage() {
  const params = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [createdProjects, setCreatedProjects] = useState<any[]>([]);
  const [investedProjects, setInvestedProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<
    "about" | "created" | "invested" | "comments"
  >("about");
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowTimestamp(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchProfileData = async () => {
      const profileIdentifier = String(params.slug ?? "").trim();
      if (!profileIdentifier) {
        setLoading(false);
        return;
      }

      const isNumericId = /^\d+$/.test(profileIdentifier);
      const encodedIdentifier = encodeURIComponent(profileIdentifier);

      try {
        let profileRes;

        if (isNumericId) {
          profileRes = await api.get<UserProfile>(
            `/api/users/${profileIdentifier}/public`,
          );
        } else {
          try {
            profileRes = await api.get<UserProfile>(
              `/api/users/slug/${encodedIdentifier}/public`,
            );
          } catch {
            profileRes = await api.get<UserProfile>(
              `/api/users/${encodedIdentifier}/public`,
            );
          }
        }

        const userId = profileRes.data.id;

        const [createdRes, investedRes] = await Promise.all([
          api.get(`/api/projects/user/${userId}/created?pageSize=100`),
          api.get(`/api/projects/user/${userId}/invested`),
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
    void fetchProfileData();
  }, [params.slug]);

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
          <p className="text-slate-500 mt-2">
            Hồ sơ bạn đang tìm kiếm không khả dụng.
          </p>
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
    {
      name: "Facebook",
      icon: Webhook,
      url: profile.socialLinks?.facebook,
      color: "hover:text-blue-600",
    },
    {
      name: "LinkedIn",
      icon: Webhook,
      url: profile.socialLinks?.linkedin,
      color: "hover:text-blue-700",
    },
    {
      name: "Twitter",
      icon: Webhook,
      url: profile.socialLinks?.twitter,
      color: "hover:text-sky-500",
    },
    {
      name: "GitHub",
      icon: Webhook,
      url: profile.socialLinks?.github,
      color: "hover:text-slate-900 dark:hover:text-white",
    },
  ];

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <Navbar />

      <main className="py-12 md:py-20">
        <div className="wrapper wrapper--lg space-y-12">
          {/* Header Section */}
          <div className="relative">
            {/* Cover Photo */}
            <div className="h-48 md:h-80 rounded-[2.5rem] overflow-hidden bg-linear-to-r from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative">
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
                    src={
                      profile.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=random`
                    }
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
                      {profile.role?.toLowerCase() === "investor"
                        ? "Nhà đầu tư"
                        : "Chủ dự án"}
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

          <div className="sticky top-0 z-40 bg-background-light dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 pt-4">
            <div className="flex flex-wrap gap-5">
              <button
                type="button"
                onClick={() => setActiveSection("about")}
                className={`px-4 py-5 text-sm font-semibold transition-colors text-smaller ${
                  activeSection === "about"
                    ? "text-primary border-b-2 border-primary"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                Giới thiệu
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("created")}
                className={`px-4 py-5 text-sm font-semibold transition-colors text-smaller ${
                  activeSection === "created"
                    ? "text-primary border-b-2 border-primary"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                Dự án đã tạo
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("invested")}
                className={`px-4 py-5 text-sm font-semibold transition-colors text-smaller ${
                  activeSection === "invested"
                    ? "text-primary border-b-2 border-primary"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                Đầu tư
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("comments")}
                className={`px-4 py-5 text-sm font-semibold transition-colors text-smaller ${
                  activeSection === "comments"
                    ? "text-primary border-b-2 border-primary"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                Bình luận
              </button>
            </div>
          </div>

          {activeSection === "about" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12 px-2">
              {/* Left Column: Stats & Social */}
              <div className="space-y-8">
                {/* Basic Info */}
                <div className="p-8 rounded-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-5 bg-primary/10 flex items-center justify-center text-primary">
                      <Mail size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Email liên hệ
                      </p>
                      <p className="text-small font-bold text-slate-700 dark:text-slate-300">
                        {profile.email || "Private"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-5 bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center text-rose-600">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Địa chỉ
                      </p>
                      <p className="text-small font-bold text-slate-700 dark:text-slate-300">
                        {profile.address || "Chưa cung cấp"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-5 bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                      <Activity size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Trạng thái
                      </p>
                      <p className="text-small font-bold text-slate-700 dark:text-slate-300">
                        Hoạt động
                      </p>
                    </div>
                  </div>
                </div>

                {/* Social Links Section */}
                <div className="p-8 rounded-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-small font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                    Kết nối
                  </h3>
                  <div className="space-y-3">
                    {socialLinks.map((link) => (
                      <a
                        key={link.name}
                        href={
                          link.url
                            ? link.url.startsWith("http")
                              ? link.url
                              : `https://${link.url}`
                            : "#"
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-between px-5 py-4 rounded-5 border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all font-bold group ${!link.url && "pointer-events-none opacity-40"}`}
                      >
                        <div className="flex items-center gap-3">
                          <link.icon
                            className={`size-5 text-slate-400 ${link.color} transition-colors`}
                          />
                          <span className="text-small text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">
                            {link.name}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Bio & Projects */}
              <div className="lg:col-span-2 space-y-12">
                {/* Bio Section */}
                <section className="p-10 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm min-h-80">
                  <h3 className="text-h4 font-black text-slate-900 dark:text-white mb-8">
                    Giới thiệu
                  </h3>
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {profile.bio ||
                        "Người dùng này chưa cập nhật tiểu sử bản thân."}
                    </p>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* Projects Created Section */}
          {activeSection === "created" && (
            <div className="px-2 mt-12">
              {createdProjects.length > 0 ? (
                <section className="space-y-8">
                  <h3 className="text-h3 font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <Rocket className="size-8 text-primary" />
                    Dự án đã tạo
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {createdProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        nowTimestamp={nowTimestamp}
                      />
                    ))}
                  </div>
                </section>
              ) : (
                <div className="p-10 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-500">
                  <p>Người dùng này chưa tạo dự án nào.</p>
                </div>
              )}
            </div>
          )}

          {/* Projects Invested Section */}
          {activeSection === "invested" && (
            <div className="px-2 mt-12">
              {investedProjects.length > 0 ? (
                <section className="space-y-8">
                  <h3 className="text-h3 font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <TrendingUp className="size-8 text-emerald-500" />
                    Dự án đã đầu tư
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {investedProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        nowTimestamp={nowTimestamp}
                      />
                    ))}
                  </div>
                </section>
              ) : (
                <div className="p-10 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-500">
                  <p>Người dùng này chưa đầu tư vào dự án nào.</p>
                </div>
              )}
            </div>
          )}

          {/* Comments Section */}
          {activeSection === "comments" && (
            <div className="px-2 mt-12">
              <section className="p-10 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                <h3 className="text-h4 font-black text-slate-900 dark:text-white mb-4">
                  Bình luận
                </h3>
                <p className="text-slate-500">Chưa có bình luận nào.</p>
              </section>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
