"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { formatVnd } from "@/lib/utils";
import { AdminDashboardUser } from "@/types/admin";
import { Transaction } from "@/types/transaction";
import toast from "react-hot-toast";
import { Clock, UserCog, SquarePen, ChevronLeft, ChevronRight, User, Briefcase } from "lucide-react";

export default function UserManagement() {
   const [page, setPage] = useState(1);
   const limit = 10;
   
   // 1. Quản lý Role đang chọn (Mặc định là investor để tránh lỗi 400)
   const [selectedRole, setSelectedRole] = useState<'investor' | 'owner'>('investor');

   const { data: usersData, refetch: refetchUsers } = useQuery({
      // 2. QueryKey phải bao gồm cả selectedRole để fetch lại khi đổi tab
      queryKey: ["admin-users", page, selectedRole], 
      queryFn: async () => {
         const res = await api.get("/api/admin/dashboard/users", {
            params: {
               page, 
               limit,
               role: selectedRole
            },
         });
         return res.data;
      },
   });

   const users = usersData?.items || [];
   const meta = usersData?.meta || { totalPages: 1 };

   const { data: pendingWithdrawals = [], refetch: refetchWithdrawals } = useQuery({
      queryKey: ["admin-pending-withdrawals"],
      queryFn: async () => (await api.get<Transaction[]>("/api/transactions/admin/pending-withdrawals")).data,
   });

   const handleWithdraw = async (id: number, action: 'approve' | 'reject') => {
      try {
         await api.patch(`/api/transactions/admin/withdraw/${id}/${action}`);
         toast.success(action === 'approve' ? "Đã duyệt yêu cầu rút tiền." : "Đã từ chối yêu cầu rút tiền.");
         refetchWithdrawals();
         refetchUsers();
      } catch (err: any) {
         toast.error(err.response?.data?.message || "Lỗi xử lý yêu cầu.");
      }
   };

   const updateRole = async (userId: number, newRole: string) => {
      try {
         await api.patch(`/api/users/${userId}/role`, { role: newRole });
         toast.success("Cập nhật quyền hạn thành công.");
         refetchUsers();
      } catch (err) {
         toast.error("Không thể cập nhật quyền hạn.");
      }
   };

   return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
         <div>
            <h1 className="text-h3 font-bold text-slate-900 dark:text-white">Người dùng</h1>
            <p className="text-slate-600 dark:text-slate-400 text-body mt-1">Quản lý tài khoản, quyền hạn và phê duyệt rút tiền.</p>
         </div>

         {/* Pending Withdrawals Section - GIỮ NGUYÊN */}
         <section className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
               <Clock className="text-amber-500" />
               Yêu cầu rút tiền chờ duyệt
            </h2>
            {/* ... Nội dung bảng rút tiền giữ nguyên ... */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/30 overflow-hidden shadow-sm">
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-amber-50/50 dark:bg-amber-900/10 text-[11px] uppercase text-amber-600/70 font-bold tracking-widest border-b border-amber-100 dark:border-amber-900/20">
                        <tr>
                           <th className="px-6 py-4">Người dùng</th>
                           <th className="px-6 py-4">Số dư hiện tại</th>
                           <th className="px-6 py-4">Số tiền rút</th>
                           <th className="px-6 py-4 text-right">Thao tác</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-amber-50 dark:divide-amber-900/20">
                        {pendingWithdrawals.map((w: any) => (
                           <tr key={w.id} className="hover:bg-amber-50/30 dark:hover:bg-amber-900/5 transition-colors">
                              <td className="px-6 py-4">
                                 <p className="text-smaller font-bold text-slate-900 dark:text-white">{w.user?.fullName}</p>
                                 <p className="text-[10px] text-slate-500 mt-1">{w.user?.email}</p>
                              </td>
                              <td className="px-6 py-4">
                                 <p className="text-smaller font-bold text-slate-700 dark:text-slate-200">{formatVnd(Number(w.user?.balance))}</p>
                              </td>
                              <td className="px-6 py-4">
                                 <p className="text-smaller font-extrabold text-red-600">{formatVnd(Number(w.amount))}</p>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <div className="flex justify-end gap-2">
                                    <button onClick={() => handleWithdraw(w.id, 'approve')} className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-[11px] font-bold hover:shadow-lg transition-all">Duyệt</button>
                                    <button onClick={() => handleWithdraw(w.id, 'reject')} className="px-4 py-1.5 rounded-lg border border-red-200 text-red-500 text-[11px] font-bold hover:bg-red-50 transition-all">Từ chối</button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </section>

         {/* User Management Section */}
         <section className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCog className="text-primary" />
                  Danh sách người dùng
               </h2>

               {/* 3. UI TABS LỌC ROLE MỚI */}
               <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
                  <button
                     onClick={() => { setSelectedRole('investor'); setPage(1); }}
                     className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${selectedRole === 'investor' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                     <User size={14} /> Nhà đầu tư
                  </button>
                  <button
                     onClick={() => { setSelectedRole('owner'); setPage(1); }}
                     className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${selectedRole === 'owner' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                     <Briefcase size={14} /> Chủ dự án
                  </button>
               </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50/50 dark:bg-slate-800/20 text-[11px] uppercase text-slate-400 font-bold tracking-widest border-b border-slate-100 dark:border-slate-800">
                        <tr>
                           <th className="px-6 py-4">Tên / Email</th>
                           <th className="px-6 py-4">Vai trò</th>
                           <th className="px-6 py-4">Số dư</th>
                           <th className="px-6 py-4">Ngày tham gia</th>
                           <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {users.map((u: any) => (
                           <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4">
                                 <p className="text-smaller font-bold text-slate-900 dark:text-white">{u.fullName}</p>
                                 <p className="text-[10px] text-slate-500 mt-0.5">{u.email}</p>
                              </td>
                              <td className="px-6 py-4">
                                 <select
                                    value={u.role}
                                    onChange={(e) => updateRole(u.id, e.target.value)}
                                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] outline-none font-bold text-primary"
                                 >
                                    <option value="investor">Investor</option>
                                    <option value="owner">Owner</option>
                                    <option value="admin">Admin</option>
                                 </select>
                              </td>
                              <td className="px-6 py-4">
                                 <p className="text-smaller font-bold text-green-600 dark:text-green-400">{formatVnd(Number(u.balance))}</p>
                              </td>
                              <td className="px-6 py-4">
                                 <p className="text-[11px] text-slate-500">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</p>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <button className="text-slate-400 hover:text-primary transition-colors">
                                    <SquarePen className="text-[20px]" />
                                 </button>
                              </td>
                           </tr>
                        ))}
                        {users.length === 0 && (
                           <tr>
                              <td colSpan={5} className="px-6 py-10 text-center text-slate-500 text-smaller italic">Không tìm thấy người dùng nào.</td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>

               {/* PHẦN ĐIỀU HƯỚNG PHÂN TRANG */}
               <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <p className="text-[11px] text-slate-500 font-medium">
                     Trang <span className="text-primary font-bold">{page}</span> / {meta.totalPages}
                  </p>
                  <div className="flex gap-2">
                     <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-all"
                     >
                        <ChevronLeft size={14} />
                     </button>
                     <button
                        onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                        disabled={page >= meta.totalPages}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-all"
                     >
                        <ChevronRight size={14} />
                     </button>
                  </div>
               </div>
            </div>
         </section>
      </div>
   );
}