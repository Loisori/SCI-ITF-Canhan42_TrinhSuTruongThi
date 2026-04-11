"use client";

//services
import Image from "next/image";
import { MapPin } from "lucide-react";

export default function ProjectLocation() {
  return (
    <section>
      <h2 className="text-h4 font-black mb-4 flex items-center gap-2">
        <MapPin className="text-primary" />
        Vị trí dự án
      </h2>
      <div className="w-full h-80 bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden relative border border-slate-200 dark:border-slate-800">
        {/* Lớp nền giả lập Map */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 bg-black">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: "radial-gradient(#0a172e 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          ></div>
        </div>

        {/* Pin chỉ vị trí */}
        <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 z-10">
          <MapPin className="text-primary text-h2 animate-bounce" />
          <p className="font-bold text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
            Vinhomes Ocean Park 3, Hưng Yên
          </p>
        </div>

        {/* Ảnh vệ tinh mờ bên dưới */}
        <Image
          src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?auto=format&fit=crop&w=1200&q=80"
          alt="Bản đồ"
          fill
          className="object-cover mix-blend-overlay opacity-30"
        />
      </div>
    </section>
  );
}
