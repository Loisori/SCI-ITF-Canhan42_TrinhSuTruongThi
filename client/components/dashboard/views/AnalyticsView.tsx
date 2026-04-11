"use client";

import { useEffect, useState, useMemo } from "react";
import {
  PieChart as RechartsPieChart,
  Pie as RechartsPie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import api from "@/lib/axios";
import { BarChart3, PieChart as LucidePieChart, TrendingUp, Info } from "lucide-react";

interface AnalyticsData {
  allocation: Array<{ category: string; value: number }>;
  projection: Array<{ date: string; amount: number }>;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Nông nghiệp": "#10b981",
  "Công nghệ": "#3b82f6",
  "Bất động sản": "#f59e0b",
  "Khác": "#94a3b8",
};

const DEFAULT_COLOR = "#8b5cf6"; // Purple for unknown categories

const formatVND = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

export default function AnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get<AnalyticsData>("/api/investments/analytics");
        setData(res.data);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const hasData = useMemo(() => {
    return (
      (data?.allocation?.length ?? 0) > 0 || (data?.projection?.length ?? 0) > 0
    );
  }, [data]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
        <div className="h-[350px] bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
        <div className="h-[350px] bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <BarChart3 className="text-4xl text-primary" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Bạn chưa có dữ liệu đầu tư
        </h2>
        <p className="text-slate-500 max-w-sm mx-auto">
          Hãy bắt đầu đầu tư vào các dự án tiềm năng để xem thống kê tài chính và dự báo lợi nhuận tại đây!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Allocation Pie Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col h-[400px]">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <LucidePieChart className="text-primary" />
            Phân bổ danh mục
          </h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <RechartsPie
                  data={data?.allocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {data?.allocation.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CATEGORY_COLORS[entry.category] || DEFAULT_COLOR} 
                    />
                  ))}
                </RechartsPie>
                <Tooltip 
                  formatter={(value: any) => formatVND(Number(value || 0))}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                />
                <Legend iconType="circle" verticalAlign="bottom" height={36}/>
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit Projection Area Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col h-[400px]">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp className="text-primary" />
            Dự báo lợi nhuận
          </h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.projection}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickFormatter={(value) => `${(Number(value || 0) / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  formatter={(value: any) => formatVND(Number(value || 0))}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="bg-primary/5 rounded-2xl border border-primary/10 p-4 text-small text-primary font-medium flex items-center gap-3">
        <Info />
        Biểu đồ dự báo dựa trên lịch thanh toán lãi dự kiến của các dự án đang hoạt động (Active). 
      </div>
    </div>
  );
}
