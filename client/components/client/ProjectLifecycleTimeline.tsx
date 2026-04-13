"use client";

import { CheckCircle2, Clock, PlayCircle, Trophy, Wallet, Ban } from "lucide-react";
import { useMemo } from "react";

interface TimelineProps {
  status: string;
  currentAmount: number;
  totalDebt: number;
}

export default function ProjectLifecycleTimeline({ status, currentAmount, totalDebt }: TimelineProps) {
  const stages = useMemo(() => {
    const s = [
      { id: 'funding', label: 'Gọi vốn', icon: Wallet, description: 'Đang mở cộng đồng' },
      { id: 'pending_admin_review', label: 'Xét duyệt', icon: Clock, description: 'Admin duyệt vốn' },
      { id: 'active', label: 'Triển khai', icon: PlayCircle, description: 'Theo lộ trình' },
      { id: 'completed_debt', label: 'Tất toán', icon: Wallet, description: 'Chủ dự án trả nợ' },
      { id: 'closed', label: 'Kết thúc', icon: Trophy, description: 'Dự án thành công' }
    ];
    return s;
  }, []);

  const getCurrentStageIndex = () => {
    switch (status) {
      case 'funding': return 0;
      case 'pending_admin_review': return 1;
      case 'active': return 2;
      case 'completed': 
        return Number(totalDebt) > 0 ? 3 : 4;
      default: return -1;
    }
  };

  const currentIndex = getCurrentStageIndex();

  if (status === 'failed' || status === 'rejected') {
    return (
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-6 flex items-center gap-4 mt-8">
        <Ban className="size-8 text-red-500" />
        <div>
          <h3 className="text-small font-black text-red-600 uppercase">Dự án đã dừng</h3>
          <p className="text-smaller text-red-500/70">Dự án này đã bị hủy hoặc không đạt mục tiêu gọi vốn.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 mt-10 shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Quy trình dự án (Lifecycle)</h2>
          <p className="text-smaller text-slate-500">Minh bạch hóa dòng vốn và tiến độ triển khai.</p>
        </div>
        <div className="px-4 py-2 bg-primary/10 rounded-xl">
           <span className="text-smaller font-bold text-primary">Trạng thái: {status.toUpperCase()}</span>
        </div>
      </div>

      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-6 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 -z-0"></div>
        <div 
          className="absolute top-6 left-0 h-1 bg-primary transition-all duration-1000 -z-0"
          style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
        ></div>

        <div className="flex justify-between relative z-10">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isCompleted = idx < currentIndex;
            const isActive = idx === currentIndex;
            
            return (
              <div key={stage.id} className="flex flex-col items-center group w-1/5">
                <div className={`size-12 rounded-2xl flex items-center justify-center border-4 transition-all duration-500 ${
                  isCompleted ? 'bg-primary border-primary text-white scale-90' :
                  isActive ? 'bg-white dark:bg-slate-900 border-primary text-primary scale-110 shadow-xl shadow-primary/20' :
                  'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-300'
                }`}>
                  {isCompleted ? <CheckCircle2 className="size-6" /> : <Icon className="size-6" />}
                </div>
                <div className="mt-4 text-center">
                  <p className={`text-[11px] font-black uppercase tracking-widest ${isActive ? 'text-primary' : isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    {stage.label}
                  </p>
                  <p className={`hidden md:block text-[9px] mt-1 font-bold ${isActive ? 'text-slate-500' : 'text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                    {stage.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
