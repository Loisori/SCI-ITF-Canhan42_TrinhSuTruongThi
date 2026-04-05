"use client";

//services
import { useState } from "react";

export default function ProjectSidebar() {
  const [amount, setAmount] = useState(50000000);
  const rate = 0.125; // 12.5%

  return (
    <aside className="space-y-6 lg:sticky lg:top-24 font-display">
      <div className="bg-white dark:bg-slate-800 border-2 border-primary/10 rounded-2xl p-6 shadow-xl">
        <div className="mb-6">
          <p className="text-slate-500 text-smaller font-medium mb-1">Đầu tư tối thiểu</p>
          <h3 className="text-h4 font-black text-primary dark:text-slate-100">10.000.000đ</h3>
        </div>

        {/* Profit Calculator */}
        <div className="space-y-4 mb-8">
          <div className="p-4 bg-primary/5 dark:bg-primary/20 rounded-xl border border-primary/10">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Nhập số tiền đầu tư</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-transparent border-none focus:ring-0 text-h6 font-bold p-0 text-primary dark:text-white"
              />
              <span className="font-bold text-slate-400">VNĐ</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-smallest text-slate-500 font-medium mb-1">Lợi nhuận dự kiến</p>
              <p className="font-bold text-emerald-500">+{rate * 100}% /năm</p>
            </div>
            <div className="text-right">
              <p className="text-smallest text-slate-500 font-medium mb-1">Tổng sau 12 tháng</p>
              <p className="font-bold text-primary dark:text-slate-100">
                {(amount * (1 + rate)).toLocaleString()}đ
              </p>
            </div>
          </div>
        </div>

        <button className="w-full py-4 bg-primary text-white rounded-xl font-black text-body shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">
          Đầu tư ngay
        </button>
      </div>
    </aside>
  );
}