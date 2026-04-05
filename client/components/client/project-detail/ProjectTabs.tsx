"use client";

//services
import { useState } from "react";

export default function ProjectTabs() {
  const [activeTab, setActiveTab] = useState("Tổng quan");
  const tabs = ["Tổng quan", "Pháp lý", "Kế hoạch vốn", "Tiến độ"];

  return (
    <nav className="flex border-b border-slate-200 dark:border-slate-800 gap-8 overflow-x-auto pb-px">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`pb-4 text-small font-bold whitespace-nowrap transition-all border-b-2 ${
            activeTab === tab
              ? "border-primary text-primary dark:text-white"
              : "border-transparent text-slate-500 hover:text-primary"
          }`}
        >
          {tab}
        </button>
      ))}
    </nav>
  );
}
