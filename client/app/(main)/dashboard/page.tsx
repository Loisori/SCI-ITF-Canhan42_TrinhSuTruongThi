/* eslint-disable @next/next/no-img-element */
"use client";

//servies
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

//components
import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";

//types
import { UserProfile } from "@/types/user";
import { Investment } from "@/types/investment";
import { Transaction } from "@/types/transaction";
import { Project } from "@/types/project";
import { AdminOverview, AdminDashboardUser } from "@/types/admin";
import {
  DashboardProfileProps,
  DashboardSidebarProps,
  OwnerProject,
  PaginationProps,
} from "@/types/dashboard";

function formatVnd(amount: number) {
  if (!Number.isFinite(amount)) return "0 đ";
  return `${Number(amount).toLocaleString("vi-VN")} đ`;
}

function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className="flex items-center justify-end gap-2 mt-4">
      <button
        type="button"
        disabled={prevDisabled}
        onClick={() => onChange(page - 1)}
        className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50"
      >
        Trước
      </button>
      <span className="text-small text-slate-600 dark:text-slate-300">
        Trang {page}/{totalPages}
      </span>
      <button
        type="button"
        disabled={nextDisabled}
        onClick={() => onChange(page + 1)}
        className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50"
      >
        Sau
      </button>
    </div>
  );
}

function DashboardSidebar({ role }: DashboardSidebarProps) {
  const sections =
    role === "admin"
      ? [
          { id: "admin-overview", label: "Tổng quan" },
          { id: "admin-approvals", label: "Duyệt dự án" },
          { id: "admin-users", label: "Quản lý người dùng" },
        ]
      : role === "owner"
        ? [
            { id: "owner-projects", label: "Dự án của tôi" },
            { id: "owner-actions", label: "Dừng nhận vốn" },
          ]
        : [
            { id: "investor-portfolio", label: "Danh mục" },
            { id: "investor-transactions", label: "Giao dịch" },
          ];

  return (
    <aside className="w-full lg:w-72 shrink-0">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 lg:p-5">
        <div className="mb-4">
          <p className="text-smaller text-slate-500 font-bold uppercase tracking-wider">
            Sidebar
          </p>
          <p className="text-small text-slate-700 dark:text-slate-200 font-semibold mt-1">
            {role === "admin"
              ? "Admin"
              : role === "owner"
                ? "Owner"
                : "Investor"}
          </p>
        </div>

        <nav className="space-y-2">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-smaller font-semibold text-slate-700 dark:text-slate-200 hover:bg-primary/5 hover:text-primary dark:hover:text-primary transition-colors border border-transparent hover:border-primary/20"
            >
              <span className="material-symbols-outlined text-[18px]">
                dashboard
              </span>
              {s.label}
            </a>
          ))}
        </nav>

        {role !== "admin" ? (
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/10">
            <Link
              href="/dashboard/deposit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white font-bold text-smallaller hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined">payments</span>
              Nạp tiền
            </Link>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function DashboardPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const payment = searchParams.get("payment");
  const amount = Number(searchParams.get("amount") ?? "0");

  const {
    data: profile,
    isLoading: profileLoading,
    error,
  } = useQuery({
    queryKey: ["auth-profile"],
    queryFn: async () => {
      const res = await api.get<UserProfile>("/api/auth/profile");
      return res.data;
    },
    retry: false,
  });

  const [paymentToast, setPaymentToast] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    if (payment === "success") {
      setPaymentToast(
        `Chúc mừng ${profile.fullName}, ${formatVnd(amount)} đã nạp thành công vào ví!`,
      );
      window.dispatchEvent(new Event("auth-changed"));
      const timer = window.setTimeout(() => setPaymentToast(null), 3500);
      return () => window.clearTimeout(timer);
    }

    if (payment === "failed") {
      setPaymentToast("Thanh toán chưa thành công. Vui lòng thử lại.");
      const timer = window.setTimeout(() => setPaymentToast(null), 3500);
      return () => window.clearTimeout(timer);
    }
  }, [payment, amount, profile]);

  useEffect(() => {
    if (!error && profileLoading) return;
    if (error) {
      router.push("/login");
    }
  }, [error, profileLoading, router]);

  const role = profile?.role;

  if (profileLoading || !profile) {
    return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
        <Navbar />
        <main className="wrapper wrapper--lg py-12 animate-pulse space-y-6">
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />
      {paymentToast ? (
        <div className="fixed top-20 right-6 z-[70] rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-small font-semibold text-green-700 shadow-xl">
          {paymentToast}
        </div>
      ) : null}

      <main className="wrapper wrapper--lg py-12">
        <div className="flex gap-6 items-start">
          <DashboardSidebar role={role} />

          <div className="flex-1 min-w-0">
            {role === "admin" ? (
              <AdminDashboard profile={profile} />
            ) : role === "owner" ? (
              <OwnerDashboard profile={profile} />
            ) : (
              <InvestorDashboard profile={profile} />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function AdminDashboard({ profile }: DashboardProfileProps) {
  const [pendingPage, setPendingPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [usersRole, setUsersRole] = useState<"owner" | "investor">("owner");
  const pendingPageSize = 10;
  const usersPageSize = 10;

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["admin-dashboard-overview"],
    queryFn: async () =>
      (await api.get<AdminOverview>("/api/admin/dashboard/overview")).data,
  });

  const { data: pendingProjects = [], refetch: refetchPending } = useQuery({
    queryKey: ["admin-pending-projects"],
    queryFn: async () =>
      (await api.get<Project[]>("/api/admin/projects/pending")).data,
    staleTime: 30_000,
  });

  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-dashboard-users", usersRole, usersPage],
    queryFn: async () => {
      return (
        await api.get<{
          items: AdminDashboardUser[];
          total: number;
          page: number;
          pageSize: number;
        }>(
          `/api/admin/dashboard/users?role=${usersRole}&page=${usersPage}&pageSize=${usersPageSize}`,
        )
      ).data;
    },
    staleTime: 30_000,
  });

  const pendingTotal = pendingProjects.length;
  const pendingItems = pendingProjects.slice(
    (pendingPage - 1) * pendingPageSize,
    pendingPage * pendingPageSize,
  );

  const totalPendingPages = Math.max(
    1,
    Math.ceil(pendingTotal / pendingPageSize),
  );

  useEffect(() => {
    if (pendingPage > totalPendingPages) {
      setPendingPage(totalPendingPages);
    }
  }, [pendingPage, totalPendingPages]);

  const approve = async (id: number) => {
    await api.patch(`/api/admin/projects/${id}/approve`);
    await refetchPending();
  };

  const reject = async (id: number) => {
    await api.patch(`/api/admin/projects/${id}/reject`);
    await refetchPending();
  };

  return (
    <div className="space-y-10">
      <section id="admin-overview" className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-h3 font-bold text-slate-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-body mt-1">
              Quản lý dự án, hệ thống & người dùng.
            </p>
          </div>
          <div className="text-right">
            <p className="text-small text-slate-600 dark:text-slate-300">
              Xin chào:{" "}
              <span className="text-primary font-bold">{profile.fullName}</span>
            </p>
          </div>
        </div>

        {overviewLoading ? (
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        ) : overview ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <p className="text-smaller text-slate-500 mb-1">Pending</p>
              <p className="text-h4 font-bold text-slate-900 dark:text-white">
                {overview.pendingCount}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <p className="text-smaller text-slate-500 mb-1">Funding</p>
              <p className="text-h4 font-bold text-primary">
                {overview.fundingCount}
              </p>
              <p className="text-small text-slate-500 mt-2">
                Vốn đang lưu chuyển: {formatVnd(overview.totalFundingCapital)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <p className="text-smaller text-slate-500 mb-1">Completed</p>
              <p className="text-h4 font-bold text-emerald-600 dark:text-emerald-400">
                {overview.completedCount}
              </p>
              <p className="text-small text-slate-500 mt-2">
                Doanh thu hệ thống: {formatVnd(overview.systemRevenue)}
              </p>
            </div>
          </div>
        ) : null}
      </section>

      <section id="admin-approvals" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h5 font-bold text-slate-900 dark:text-white">
              Dự án chờ duyệt
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-body mt-1">
              Approve/Reject để cập nhật trạng thái dự án.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-small">
              <thead className="bg-slate-50 dark:bg-slate-950">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">
                    Dự án
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">
                    Chủ dự án
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">
                    Mục tiêu
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {pendingItems.map((p: any) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <td className="px-6 py-4">
                      <div className="text-small font-semibold text-slate-900 dark:text-white">
                        {p.title}
                      </div>
                      <div className="text-smaller text-slate-500 mt-1">
                        {p.shortDescription ?? "Không có mô tả ngắn"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-smaller">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {p.owner?.fullName ?? "-"}
                      </div>
                      <div className="text-slate-500">
                        {p.owner?.email ?? "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-smaller">
                      {Number(p.targetCapital).toLocaleString("vi-VN")} đ
                    </td>
                    <td className="px-6 py-4 text-smaller text-slate-600 dark:text-slate-300">
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleDateString("vi-VN")
                        : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => approve(p.id)}
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-white font-semibold hover:bg-emerald-500 transition"
                        >
                          Duyệt
                        </button>
                        <button
                          type="button"
                          onClick={() => reject(p.id)}
                          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-white font-semibold hover:bg-red-500 transition"
                        >
                          Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {pendingItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-slate-500"
                    >
                      Không có dự án cần duyệt.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination
          page={pendingPage}
          pageSize={pendingPageSize}
          total={pendingTotal}
          onChange={setPendingPage}
        />
      </section>

      <section id="admin-users" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h5 font-bold text-slate-900 dark:text-white">
              Quản lý người dùng
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-body mt-1">
              Hiển thị tổng quan theo role (Owner/Investor).
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setUsersRole("owner");
                setUsersPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-bold border ${
                usersRole === "owner"
                  ? "bg-primary text-white border-primary"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              }`}
            >
              Owner
            </button>
            <button
              type="button"
              onClick={() => {
                setUsersRole("investor");
                setUsersPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-bold border ${
                usersRole === "investor"
                  ? "bg-primary text-white border-primary"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              }`}
            >
              Investor
            </button>
          </div>
        </div>

        {usersLoading || !usersResponse ? (
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        ) : (
          <div className="space-y-3">
            {usersResponse.items.map((u) => (
              <div
                key={u.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {u.fullName}
                    </p>
                    <p className="text-smaller text-slate-500 truncate">
                      {u.email}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                        <p className="text-[11px] uppercase text-slate-500 font-bold">
                          Số dư ví
                        </p>
                        <p className="font-bold text-primary">
                          {formatVnd(Number(u.balance))}
                        </p>
                      </div>
                      <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                        <p className="text-[11px] uppercase text-slate-500 font-bold">
                          Đã đầu tư
                        </p>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {formatVnd(u.totalInvested)}
                        </p>
                      </div>
                      {usersRole === "owner" ? (
                        <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                          <p className="text-[11px] uppercase text-slate-500 font-bold">
                            Phí sàn thu
                          </p>
                          <p className="font-bold text-primary">
                            {formatVnd(u.feeCollected)}
                          </p>
                        </div>
                      ) : (
                        <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                          <p className="text-[11px] uppercase text-slate-500 font-bold">
                            Đã nhận
                          </p>
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatVnd(u.totalReceived)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-smaller font-bold text-slate-700 dark:text-slate-200">
                    Dự án tham gia
                  </p>
                  {u.participatingProjects.length === 0 ? (
                    <p className="text-smaller text-slate-500 mt-2">
                      Chưa có dữ liệu.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {u.participatingProjects.map((p) => (
                        <div
                          key={p.id}
                          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-white/5"
                        >
                          <p className="text-smaller font-bold text-slate-900 dark:text-white">
                            {p.title}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Tiến độ: {p.fundingProgress}%
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <Pagination
              page={usersPage}
              pageSize={usersPageSize}
              total={usersResponse.total}
              onChange={setUsersPage}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function InvestorDashboard({ profile }: DashboardProfileProps) {
  const txPageSize = 10;
  const [txPage, setTxPage] = useState(1);
  const trackedPageSize = 10;
  const [trackedPage, setTrackedPage] = useState(1);

  const { data: investments = [] } = useQuery({
    queryKey: ["investments-my"],
    queryFn: async () =>
      (await api.get<Investment[]>("/api/investments/my-investments")).data,
    staleTime: 30_000,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions-my"],
    queryFn: async () =>
      (await api.get<Transaction[]>("/api/transactions")).data,
    staleTime: 30_000,
  });

  const activeInvestments = investments.filter((i) => i.status === "active");
  const totalActiveInvested = activeInvestments.reduce(
    (sum, i) => sum + Number(i.amount),
    0,
  );

  const profitReceived = transactions
    .filter((t) => t.status === "success" && t.type === "interest_receive")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const roiPercent =
    totalActiveInvested > 0
      ? Number(((profitReceived / totalActiveInvested) * 100).toFixed(2))
      : 0;

  const trackedProjectsAll = useMemo(() => {
    const map = new Map<
      number,
      {
        projectId: number;
        title: string;
        investmentId: number;
        amount: number;
        status: string;
        thumbnailUrl: string | null;
        nextDueDate: string | null;
      }
    >();
    for (const inv of investments) {
      if (!inv.project) continue;
      if (inv.status === "withdrawn") continue;

      const schedules = inv.paymentSchedules ?? [];
      const nextSchedule = schedules
        .filter((s) => s.status !== "paid")
        .slice()
        .sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
        )[0];

      if (!map.has(inv.project.id)) {
        map.set(inv.project.id, {
          projectId: inv.project.id,
          title: inv.project.title,
          investmentId: inv.id,
          amount: Number(inv.amount),
          status: inv.status,
          thumbnailUrl: inv.project.thumbnailUrl,
          nextDueDate: nextSchedule?.dueDate ?? null,
        });
      }
    }
    return Array.from(map.values());
  }, [investments]);

  const trackedTotal = trackedProjectsAll.length;
  const trackedProjects = trackedProjectsAll.slice(
    (trackedPage - 1) * trackedPageSize,
    trackedPage * trackedPageSize,
  );

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(trackedTotal / trackedPageSize));
    if (trackedPage > totalPages) {
      setTrackedPage(totalPages);
    }
  }, [trackedTotal, trackedPage, trackedPageSize]);

  const filteredTx = useMemo(() => {
    return transactions
      .filter((t) => t.status === "success")
      .filter((t) => ["deposit", "invest", "refund"].includes(t.type))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [transactions]);

  const txTotal = filteredTx.length;
  const txItems = filteredTx.slice(
    (txPage - 1) * txPageSize,
    txPage * txPageSize,
  );

  const isEmpty = investments.length === 0;

  return (
    <div className="space-y-10">
      <section id="investor-portfolio" className="space-y-4">
        <div>
          <h1 className="text-h3 font-bold text-slate-900 dark:text-white">
            Investor Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-body mt-1">
            Portfolio, lịch thanh toán & tổng hợp lợi nhuận.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <p className="text-smaller text-slate-500 mb-1">Số dư hiện tại</p>
            <p className="text-h4 font-bold text-green-600 dark:text-green-400">
              {formatVnd(Number(profile.balance)).replace(" đ", "")} đ
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <p className="text-smaller text-slate-500 mb-1">
              Tổng đang đầu tư (Active)
            </p>
            <p className="text-h4 font-bold text-slate-900 dark:text-white">
              {formatVnd(totalActiveInvested).replace(" đ", "")} đ
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <p className="text-smaller text-slate-500 mb-1">
              Lợi nhuận đã nhận (ROI)
            </p>
            <p className="text-h4 font-bold text-emerald-600 dark:text-emerald-400">
              {roiPercent}%
            </p>
            <p className="text-small text-slate-500 mt-2">
              {formatVnd(profitReceived)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="text-h5 font-bold text-slate-900 dark:text-white">
            Dự án đang theo dõi
          </h2>

          {isEmpty ? (
            <p className="text-smaller text-slate-500 mt-3">
              Bạn chưa có khoản đầu tư nào.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {trackedProjects.map((p) => (
                <div
                  key={p.projectId}
                  className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {p.thumbnailUrl ? (
                      <img
                        src={p.thumbnailUrl}
                        alt=""
                        className="w-14 h-10 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {p.title}
                      </p>
                      <p className="text-smaller text-slate-500 mt-1">
                        Trạng thái: {p.status}
                      </p>
                      <p className="text-smaller text-slate-500">
                        Lần tới:{" "}
                        {p.nextDueDate
                          ? new Date(p.nextDueDate).toLocaleDateString("vi-VN")
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-primary">
                      {formatVnd(p.amount)}
                    </p>
                    <p className="text-smaller text-slate-500 mt-1">
                      <Link
                        href={`/projects/${p.projectId}`}
                        className="hover:underline"
                      >
                        Xem chi tiết
                      </Link>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Pagination
            page={trackedPage}
            pageSize={trackedPageSize}
            total={trackedTotal}
            onChange={setTrackedPage}
          />
        </div>
      </section>

      <section id="investor-transactions" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h5 font-bold text-slate-900 dark:text-white">
              Lịch sử giao dịch
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-body mt-1">
              Deposit, Investment, Refund.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-small">
              <thead className="bg-slate-50 dark:bg-slate-950">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">
                    Loại
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">
                    Số tiền
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">
                    Mô tả
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">
                    Ngày
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {txItems.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {t.type === "deposit"
                        ? "VNPay Deposit"
                        : t.type === "invest"
                          ? "Investment"
                          : t.type === "refund"
                            ? "Refund"
                            : t.type}
                    </td>
                    <td className="px-6 py-4 font-bold text-primary">
                      {formatVnd(Number(t.amount))}
                    </td>
                    <td className="px-6 py-4 text-smaller text-slate-600 dark:text-slate-300">
                      {t.description ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-smaller text-slate-600 dark:text-slate-300">
                      {t.createdAt
                        ? new Date(t.createdAt).toLocaleString("vi-VN")
                        : "-"}
                    </td>
                  </tr>
                ))}
                {txItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-10 text-center text-slate-500"
                    >
                      Chưa có giao dịch phù hợp.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination
          page={txPage}
          pageSize={txPageSize}
          total={txTotal}
          onChange={setTxPage}
        />
      </section>
    </div>
  );
}

function OwnerDashboard({ profile }: DashboardProfileProps) {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: ownerProjectsResponse, isLoading } = useQuery({
    queryKey: ["owner-projects", page],
    queryFn: async () => {
      return (
        await api.get<{
          items: OwnerProject[];
          total: number;
          page: number;
          pageSize: number;
        }>(`/api/projects/owner?page=${page}&pageSize=${pageSize}`)
      ).data;
    },
    staleTime: 30_000,
  });

  const ownerProjects = ownerProjectsResponse?.items ?? [];

  const [stoppingId, setStoppingId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const totalInvestorsOnPage = ownerProjects.reduce(
    (sum, p) => sum + (p.investorsCount ?? 0),
    0,
  );

  const stopEarly = async (id: number) => {
    const confirmed = window.confirm(
      "Bạn có chắc muốn dừng nhận vốn dự án này?",
    );
    if (!confirmed) return;

    try {
      setStoppingId(id);
      const res = await api.put<{
        netReceived?: number;
        commissionAmount?: number;
        status?: string;
      }>(`/api/projects/${id}/stop-funding`);
      setToast(
        res.data?.netReceived
          ? `Đã dừng nhận vốn. Thực nhận: ${formatVnd(Number(res.data.netReceived))}`
          : "Đã dừng nhận vốn thành công.",
      );
      // Refetch by changing page state back and forth not ideal; use query invalidation would be better,
      // but giữ đơn giản: reload current route.
      window.dispatchEvent(new Event("auth-changed"));
      window.location.reload();
    } catch (e: any) {
      const message = e?.response?.data?.message ?? "Không thể dừng nhận vốn.";
      setToast(message);
    } finally {
      setStoppingId(null);
    }
  };

  return (
    <div className="space-y-10">
      <section id="owner-projects" className="space-y-4">
        <div>
          <h1 className="text-h3 font-bold text-slate-900 dark:text-white">
            Owner Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-body mt-1">
            Creator Studio: quản lý dự án và theo dõi tiến độ.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <p className="text-smaller text-slate-500 mb-1">Số dự án</p>
            <p className="text-h4 font-bold text-slate-900 dark:text-white">
              {ownerProjectsResponse?.total ?? 0}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <p className="text-smaller text-slate-500 mb-1">
              Tổng Investor (trang hiện tại)
            </p>
            <p className="text-h4 font-bold text-primary">
              {totalInvestorsOnPage}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <p className="text-smaller text-slate-500 mb-1">Số dư ví</p>
            <p className="text-h4 font-bold text-green-600 dark:text-green-400">
              {Number(profile.balance).toLocaleString("vi-VN")} đ
            </p>
          </div>
        </div>

        {toast ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-smaller font-semibold text-slate-700 dark:text-slate-200">
            {toast}
          </div>
        ) : null}

        {isLoading ? (
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        ) : (
          <div className="space-y-3">
            {ownerProjects.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    {p.thumbnailUrl ? (
                      <img
                        src={p.thumbnailUrl}
                        alt=""
                        className="w-16 h-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-12 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {p.title}
                      </p>
                      {p.category?.name ? (
                        <p className="text-smaller text-primary mt-1 font-bold">
                          {p.category.name}
                        </p>
                      ) : null}
                      <p className="text-smaller text-slate-500 mt-1">
                        Trạng thái:{" "}
                        <span className="font-bold">{p.status}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-smaller text-slate-500">Tiến độ</p>
                    <p className="text-h4 font-bold text-primary">
                      {p.fundingProgress}%
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-smaller">
                    <span className="text-slate-600 dark:text-slate-300 font-semibold">
                      Tổng Investor
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {p.investorsCount} investor
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-smaller">
                    <span className="text-slate-600 dark:text-slate-300 font-semibold">
                      Thực nhận (sau phí sàn)
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatVnd(p.netAfterFeeEstimate ?? 0)}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full"
                      style={{
                        width: `${Math.min(100, Number(p.fundingProgress))}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/my-projects/${p.id}/edit`}
                      className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                    >
                      Chỉnh sửa
                    </Link>
                    <Link
                      href={`/projects/${p.contentSlug ?? p.id}`}
                      className="px-4 py-2 rounded-lg bg-primary text-white font-bold hover:opacity-90 transition"
                    >
                      Xem dự án
                    </Link>
                  </div>

                  <div>
                    <button
                      type="button"
                      disabled={stoppingId === p.id || p.status !== "funding"}
                      onClick={() => stopEarly(p.id)}
                      className="px-5 py-2 rounded-lg bg-red-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-500 transition"
                    >
                      {stoppingId === p.id ? "Đang xử lý..." : "Dừng nhận vốn"}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <Pagination
              page={page}
              pageSize={pageSize}
              total={ownerProjectsResponse?.total ?? 0}
              onChange={setPage}
            />
          </div>
        )}
      </section>

      <section id="owner-actions" className="space-y-3">
        <h2 className="text-h5 font-bold text-slate-900 dark:text-white">
          Thao tác nhanh
        </h2>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-smaller text-slate-600 dark:text-slate-300">
          Chọn dự án ở danh sách phía trên và nhấn{" "}
          <span className="font-bold text-slate-900 dark:text-slate-100">
            Dừng nhận vốn
          </span>{" "}
          khi dự án ở trạng thái{" "}
          <span className="font-bold text-slate-900 dark:text-slate-100">
            funding
          </span>
          .
        </div>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div />}>
      <DashboardPageInner />
    </Suspense>
  );
}
