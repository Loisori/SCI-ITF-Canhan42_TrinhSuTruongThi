"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";
import api from "@/lib/axios";
import { Project, ProjectDetail } from "@/types/project";
import { UserProfile } from "@/types/user";
import dynamic from "next/dynamic";
import rehypeSanitize from "rehype-sanitize";
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
import ProjectCard from "@/components/client/ProjectCard";

const MarkdownPreview = dynamic(() => import("@uiw/react-markdown-preview"), {
  ssr: false,
  loading: () => <div className="animate-pulse h-24 bg-slate-100 rounded-xl" />,
});

type PublicProjectItem = {} & Project & {
    disputes?: Array<{
      id: number;
      reason: string;
      evidenceUrl?: string | null;
      status: string;
      createdAt: string;
    }>;
  };

type InvestedProjectItem = Project;

type VotingHistoryItem = {
  id: number;
  projectId: number;
  projectTitle: string;
  milestoneId: number;
  milestoneTitle: string;
  milestoneStage: number;
  isApprove: boolean;
  comment: string | null;
  createdAt: string;
};

type VotingHistoryGroup = {
  projectId: number;
  projectTitle: string;
  milestoneId: number;
  milestoneTitle: string;
  milestoneStage: number;
  items: VotingHistoryItem[];
};

type InvestedProjectActivity = {
  projectId: number;
  projectTitle: string;
  projectSlug?: string;
  thumbnailUrl?: string | null;
  votes: VotingHistoryItem[];
  disputes: Array<{
    id: number;
    reason: string;
    evidenceUrl?: string | null;
    status: string;
    createdAt: string;
  }>;
};

export default function PublicProfilePage() {
  const params = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [createdProjects, setCreatedProjects] = useState<PublicProjectItem[]>(
    [],
  );
  const [investedProjects, setInvestedProjects] = useState<
    InvestedProjectItem[]
  >([]);
  const [votingHistory, setVotingHistory] = useState<VotingHistoryItem[]>([]);
  const [investedActivity, setInvestedActivity] = useState<
    InvestedProjectActivity[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<
    "about" | "created" | "invested" | "disputes" | "voting"
  >("about");
  const [votingLoading, setVotingLoading] = useState(false);
  const [investedActivityLoading, setInvestedActivityLoading] = useState(false);
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
        setCreatedProjects(
          (createdRes.data?.items ||
            createdRes.data ||
            []) as PublicProjectItem[],
        );
        setInvestedProjects((investedRes.data || []) as InvestedProjectItem[]);
      } catch (err) {
        console.error("Failed to fetch public profile data:", err);
      } finally {
        setLoading(false);
      }
    };
    void fetchProfileData();
  }, [params.slug]);

  useEffect(() => {
    setVotingHistory([]);
  }, [params.slug]);

  useEffect(() => {
    if (
      activeSection !== "invested" ||
      !profile ||
      investedProjects.length === 0
    ) {
      setInvestedActivity([]);
      return;
    }

    const fetchInvestedActivity = async () => {
      setInvestedActivityLoading(true);

      try {
        const activityEntries = await Promise.all(
          investedProjects.map(async (project) => {
            const detailRes = await api.get<ProjectDetail>(
              `/api/projects/${project.id}`,
            );
            const milestones = detailRes.data.milestones ?? [];

            const voteEntries = await Promise.all(
              milestones.map(async (milestone) => {
                const response = await api.get<
                  Array<{
                    userId: number | string;
                    id: number;
                    isApprove: boolean;
                    comment: string | null;
                    createdAt: string;
                  }>
                >(`/api/projects/milestones/${milestone.id}/votes`);

                return (response.data || [])
                  .filter((vote) => Number(vote.userId) === profile.id)
                  .map((vote) => ({
                    id: vote.id,
                    projectId: detailRes.data.id,
                    projectTitle: detailRes.data.title,
                    milestoneId: milestone.id,
                    milestoneTitle: milestone.title,
                    milestoneStage: milestone.stage,
                    isApprove: vote.isApprove,
                    comment: vote.comment,
                    createdAt: vote.createdAt,
                  }));
              }),
            );

            const disputes = (detailRes.data.disputes ?? [])
              .filter((dispute) => Number(dispute.userId) === profile.id)
              .map((dispute) => ({
                id: dispute.id,
                reason: dispute.reason,
                evidenceUrl: dispute.evidenceUrl,
                status: dispute.status,
                createdAt: dispute.createdAt,
              }));

            return {
              projectId: detailRes.data.id,
              projectTitle: detailRes.data.title,
              projectSlug: project.slug,
              thumbnailUrl:
                detailRes.data.thumbnailUrl ?? project.thumbnailUrl ?? null,
              votes: voteEntries.flat(),
              disputes,
            };
          }),
        );

        setInvestedActivity(activityEntries);
      } catch (error) {
        console.error("Failed to fetch invested activity:", error);
        setInvestedActivity([]);
      } finally {
        setInvestedActivityLoading(false);
      }
    };

    void fetchInvestedActivity();
  }, [activeSection, investedProjects, profile]);

  useEffect(() => {
    if (
      activeSection !== "voting" ||
      !profile ||
      investedProjects.length === 0
    ) {
      return;
    }

    const fetchVotingHistory = async () => {
      setVotingLoading(true);

      try {
        const voteEntries = await Promise.all(
          investedProjects.map(async (project) => {
            const detailRes = await api.get<ProjectDetail>(
              `/api/projects/${project.id}`,
            );
            const milestones = detailRes.data.milestones ?? [];

            const milestoneVotes = await Promise.all(
              milestones.map(async (milestone) => {
                const response = await api.get<
                  Array<{
                    userId: number | string;
                    id: number;
                    isApprove: boolean;
                    comment: string | null;
                    createdAt: string;
                  }>
                >(`/api/projects/milestones/${milestone.id}/votes`);

                return (response.data || [])
                  .filter((vote) => Number(vote.userId) === profile.id)
                  .map((vote) => ({
                    id: vote.id,
                    projectId: detailRes.data.id,
                    projectTitle: detailRes.data.title,
                    milestoneId: milestone.id,
                    milestoneTitle: milestone.title,
                    milestoneStage: milestone.stage,
                    isApprove: vote.isApprove,
                    comment: vote.comment,
                    createdAt: vote.createdAt,
                  }));
              }),
            );

            return milestoneVotes.flat();
          }),
        );

        setVotingHistory(voteEntries.flat());
      } catch (error) {
        console.error("Failed to fetch voting history:", error);
        setVotingHistory([]);
      } finally {
        setVotingLoading(false);
      }
    };

    void fetchVotingHistory();
  }, [activeSection, investedProjects, profile]);

  const disputeItems = useMemo(
    () =>
      createdProjects.flatMap((project) =>
        (project.disputes ?? []).map((dispute) => ({
          ...dispute,
          projectId: project.id,
          projectTitle: project.title,
          projectSlug: project.slug,
        })),
      ),
    [createdProjects],
  );

  const groupedVotingHistory = useMemo(() => {
    const groups = new Map<string, VotingHistoryGroup>();

    for (const vote of votingHistory) {
      const key = `${vote.projectId}:${vote.milestoneId}`;
      const existing = groups.get(key);

      if (existing) {
        existing.items.push(vote);
        continue;
      }

      groups.set(key, {
        projectId: vote.projectId,
        projectTitle: vote.projectTitle,
        milestoneId: vote.milestoneId,
        milestoneTitle: vote.milestoneTitle,
        milestoneStage: vote.milestoneStage,
        items: [vote],
      });
    }

    return Array.from(groups.values()).sort((a, b) => {
      if (a.projectId !== b.projectId) {
        return a.projectId - b.projectId;
      }
      return a.milestoneStage - b.milestoneStage;
    });
  }, [votingHistory]);

  const votingTotals = useMemo(() => {
    const total = votingHistory.length;
    const agree = votingHistory.filter((vote) => vote.isApprove).length;
    const disagree = total - agree;

    return { total, agree, disagree };
  }, [votingHistory]);

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
                <Image
                  src={profile.coverPhotoUrl}
                  alt="Cover"
                  fill
                  unoptimized
                  className="object-cover"
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
                <div className="size-32 md:size-40 rounded-full border-4 border-white dark:border-slate-950 shadow-2xl overflow-hidden bg-white dark:bg-slate-900 shrink-0 relative">
                  <Image
                    src={
                      profile.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=random`
                    }
                    alt={profile.fullName}
                    fill
                    unoptimized
                    className="object-cover"
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
                onClick={() => setActiveSection("disputes")}
                className={`px-4 py-5 text-sm font-semibold transition-colors text-smaller ${
                  activeSection === "disputes"
                    ? "text-primary border-b-2 border-primary"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                Tranh chấp
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("voting")}
                className={`px-4 py-5 text-sm font-semibold transition-colors text-smaller ${
                  activeSection === "voting"
                    ? "text-primary border-b-2 border-primary"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                Bình chọn
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

                  <div className="space-y-4">
                    <h4 className="text-h5 font-black text-slate-900 dark:text-white">
                      Hoạt động của bạn
                    </h4>

                    {investedActivityLoading ? (
                      <div className="p-6 rounded-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500">
                        Đang tải dữ liệu bình chọn và tranh chấp...
                      </div>
                    ) : investedActivity.length > 0 ? (
                      <div className="space-y-4">
                        {investedActivity.map((activity) => {
                          const agreeVotes = activity.votes.filter(
                            (vote) => vote.isApprove,
                          );
                          const disagreeVotes = activity.votes.filter(
                            (vote) => !vote.isApprove,
                          );

                          return (
                            <article
                              key={activity.projectId}
                              className="p-6 rounded-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <h5 className="text-h6 font-bold text-slate-900 dark:text-white">
                                    {activity.projectTitle}
                                  </h5>
                                  <p className="text-small text-slate-500">
                                    {activity.votes.length} lượt bình chọn của
                                    bạn, {activity.disputes.length} tranh chấp
                                    của bạn
                                  </p>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold uppercase tracking-widest">
                                    Đồng ý: {agreeVotes.length}
                                  </span>
                                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold uppercase tracking-widest">
                                    Không đồng ý: {disagreeVotes.length}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-3xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-900/15 p-4 space-y-3">
                                  <div className="font-bold text-emerald-700 dark:text-emerald-300">
                                    Bài bình chọn của bạn
                                  </div>
                                  {activity.votes.length ? (
                                    activity.votes.map((vote) => (
                                      <div
                                        key={vote.id}
                                        className="rounded-2xl bg-white dark:bg-slate-900/70 border border-emerald-100 dark:border-emerald-900/40 p-3"
                                      >
                                        <p className="text-smaller font-semibold text-slate-900 dark:text-white">
                                          Giai đoạn {vote.milestoneStage}:{" "}
                                          {vote.milestoneTitle}
                                        </p>
                                        <p className="text-smaller text-slate-600 dark:text-slate-300 mt-1">
                                          {vote.comment ||
                                            (vote.isApprove
                                              ? "Đồng ý."
                                              : "Không có lý do.")}
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-2">
                                          {new Date(
                                            vote.createdAt,
                                          ).toLocaleString("vi-VN")}
                                        </p>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-smaller text-slate-500">
                                      Bạn chưa có bình chọn nào ở dự án này.
                                    </p>
                                  )}
                                </div>

                                <div className="rounded-3xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-900/15 p-4 space-y-3">
                                  <div className="font-bold text-rose-700 dark:text-rose-300">
                                    Tranh chấp của bạn
                                  </div>
                                  {activity.disputes.length ? (
                                    activity.disputes.map((dispute) => (
                                      <div
                                        key={dispute.id}
                                        className="rounded-2xl bg-white dark:bg-slate-900/70 border border-rose-100 dark:border-rose-900/40 p-3"
                                      >
                                        <p className="text-smaller font-semibold text-slate-900 dark:text-white">
                                          {dispute.status}
                                        </p>
                                        <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 p-3">
                                          <MarkdownPreview
                                            source={dispute.reason}
                                            rehypePlugins={[[rehypeSanitize]]}
                                            style={{
                                              background: "transparent",
                                              color: "inherit",
                                            }}
                                          />
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-2">
                                          {new Date(
                                            dispute.createdAt,
                                          ).toLocaleString("vi-VN")}
                                        </p>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-smaller text-slate-500">
                                      Bạn chưa tạo tranh chấp nào ở dự án này.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-6 rounded-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500">
                        Chưa có dữ liệu bình chọn hoặc tranh chấp để hiển thị.
                      </div>
                    )}
                  </div>
                </section>
              ) : (
                <div className="p-10 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-500">
                  <p>Người dùng này chưa đầu tư vào dự án nào.</p>
                </div>
              )}
            </div>
          )}

          {/* Disputes Section */}
          {activeSection === "disputes" && (
            <div className="px-2 mt-12">
              {disputeItems.length > 0 ? (
                <section className="space-y-8">
                  <h3 className="text-h3 font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <Layout className="size-8 text-rose-500" />
                    Tranh chấp
                  </h3>
                  <div className="space-y-4">
                    {disputeItems.map((dispute) => (
                      <article
                        key={dispute.id}
                        className="p-6 rounded-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                          <div>
                            <h4 className="text-h6 font-bold text-slate-900 dark:text-white">
                              {dispute.projectTitle}
                            </h4>
                            <p className="text-small text-slate-500">
                              {new Date(dispute.createdAt).toLocaleString(
                                "vi-VN",
                              )}
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold uppercase tracking-widest">
                            {dispute.status}
                          </span>
                        </div>
                        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-4">
                          <MarkdownPreview
                            source={dispute.reason}
                            rehypePlugins={[[rehypeSanitize]]}
                            style={{
                              background: "transparent",
                              color: "inherit",
                            }}
                          />
                        </div>
                        {dispute.evidenceUrl && (
                          <a
                            href={dispute.evidenceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex mt-3 text-small font-semibold text-primary hover:underline"
                          >
                            Xem bằng chứng
                          </a>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              ) : (
                <section className="p-10 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                  <h3 className="text-h4 font-black text-slate-900 dark:text-white mb-4">
                    Tranh chấp
                  </h3>
                  <p className="text-slate-500">Chưa có tranh chấp nào.</p>
                </section>
              )}
            </div>
          )}

          {/* Voting Section */}
          {activeSection === "voting" && (
            <div className="px-2 mt-12">
              {votingLoading ? (
                <section className="p-10 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                  <p className="text-slate-500">
                    Đang tải lịch sử bình chọn...
                  </p>
                </section>
              ) : votingHistory.length > 0 ? (
                <section className="space-y-8">
                  <h3 className="text-h3 font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <TrendingUp className="size-8 text-emerald-500" />
                    Bình chọn
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                      <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                        Tổng lượt bình chọn
                      </p>
                      <p className="text-h4 font-black text-slate-900 dark:text-white mt-1">
                        {votingTotals.total}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-900/15 p-4">
                      <p className="text-[11px] uppercase tracking-widest text-emerald-500 font-bold">
                        Đồng ý
                      </p>
                      <p className="text-h4 font-black text-emerald-700 dark:text-emerald-300 mt-1">
                        {votingTotals.agree}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-900/15 p-4">
                      <p className="text-[11px] uppercase tracking-widest text-amber-500 font-bold">
                        Không đồng ý
                      </p>
                      <p className="text-h4 font-black text-amber-700 dark:text-amber-300 mt-1">
                        {votingTotals.disagree}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {groupedVotingHistory.map((group) => {
                      const agreeVotes = group.items.filter(
                        (vote) => vote.isApprove,
                      );
                      const disagreeVotes = group.items.filter(
                        (vote) => !vote.isApprove,
                      );

                      return (
                        <article
                          key={`${group.projectId}:${group.milestoneId}`}
                          className="p-6 rounded-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <div>
                              <h4 className="text-h6 font-bold text-slate-900 dark:text-white">
                                {group.projectTitle}
                              </h4>
                              <p className="text-small text-slate-500">
                                Giai đoạn {group.milestoneStage}:{" "}
                                {group.milestoneTitle}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold uppercase tracking-widest">
                                Đồng ý: {agreeVotes.length}
                              </span>
                              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold uppercase tracking-widest">
                                Không đồng ý: {disagreeVotes.length}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-3xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-900/15 p-4 space-y-3">
                              <div className="font-bold text-emerald-700 dark:text-emerald-300">
                                Lý do đồng ý
                              </div>
                              {agreeVotes.length ? (
                                agreeVotes.map((vote) => (
                                  <div
                                    key={vote.id}
                                    className="rounded-2xl bg-white dark:bg-slate-900/70 border border-emerald-100 dark:border-emerald-900/40 p-3"
                                  >
                                    <p className="text-smaller text-slate-600 dark:text-slate-300">
                                      {vote.comment || "Đồng ý."}
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-2">
                                      {new Date(vote.createdAt).toLocaleString(
                                        "vi-VN",
                                      )}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-smaller text-slate-500">
                                  Chưa có lý do đồng ý.
                                </p>
                              )}
                            </div>

                            <div className="rounded-3xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-900/15 p-4 space-y-3">
                              <div className="font-bold text-amber-700 dark:text-amber-300">
                                Lý do không đồng ý
                              </div>
                              {disagreeVotes.length ? (
                                disagreeVotes.map((vote) => (
                                  <div
                                    key={vote.id}
                                    className="rounded-2xl bg-white dark:bg-slate-900/70 border border-amber-100 dark:border-amber-900/40 p-3"
                                  >
                                    <p className="text-smaller text-slate-600 dark:text-slate-300">
                                      {vote.comment || "Không có lý do."}
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-2">
                                      {new Date(vote.createdAt).toLocaleString(
                                        "vi-VN",
                                      )}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-smaller text-slate-500">
                                  Chưa có lý do không đồng ý.
                                </p>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ) : (
                <section className="p-10 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                  <h3 className="text-h4 font-black text-slate-900 dark:text-white mb-4">
                    Bình chọn
                  </h3>
                  <p className="text-slate-500">
                    Chưa có lịch sử bình chọn nào.
                  </p>
                </section>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
