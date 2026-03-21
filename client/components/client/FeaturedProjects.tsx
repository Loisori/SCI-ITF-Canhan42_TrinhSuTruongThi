export default function FeaturedProjects() {
  return (
    <section className="py-24 max-w-screen-lg mx-auto px-4 font-display">
      <div className="flex items-end justify-between mb-12">
        <div>
          <h3 className="text-h4 font-black text-primary dark:text-slate-100">
            Dự án nổi bật
          </h3>
          <p className="text-slate-500 mt-2">
            Cơ hội đầu tư được sàng lọc kỹ lưỡng bởi đội ngũ chuyên gia.
          </p>
        </div>
        <button className="hidden md:flex items-center gap-2 text-primary dark:text-slate-100 font-bold hover:underline">
          Xem tất cả dự án{" "}
          <span className="material-symbols-outlined">arrow_right_alt</span>
        </button>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        <ProjectCard
          title="Eco Smart City Quận 2"
          profit="15%/năm"
          progress={80}
          status="Đang gọi vốn"
        />
        <ProjectCard
          title="High-Tech Hub Sài Gòn"
          profit="18%/năm"
          progress={60}
          status="Đang gọi vốn"
        />
        <ProjectCard
          title="Green Energy Farm"
          profit="12%/năm"
          progress={95}
          status="Sắp kết thúc"
          color="orange"
        />
      </div>
    </section>
  );
}

interface ProjectCardProps {
  title: string;
  profit: string;
  progress: number;
  status: string;
  color?: "green" | "orange";
}

function ProjectCard({
  title,
  profit,
  progress,
  status,
  color = "green",
}: ProjectCardProps) {
  const statusColor = color === "orange" ? "bg-orange-500" : "bg-green-500";
  return (
    <div className="group bg-white dark:bg-white/5 rounded-2xl overflow-hidden border border-slate-100 dark:border-white/10 transition-all hover:shadow-2xl hover:-translate-y-1">
      <div className="h-[22.4rem] relative overflow-hidden bg-slate-200">
        <span
          className={`absolute top-4 right-4 ${statusColor} text-white text-smallest font-bold px-3 py-1 rounded-full uppercase z-10`}
        >
          {status}
        </span>
      </div>
      <div className="p-6">
        <h4 className="text-h6 font-bold mb-2">{title}</h4>
        <div className="flex items-center gap-1 text-primary dark:text-slate-100 mb-6">
          <span className="material-symbols-outlined text-body">payments</span>
          <span className="text-smaller font-bold">Lợi nhuận: {profit}</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-smaller font-bold">
            <span>Tiến độ</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        <button className="w-full mt-6 py-3 border-2 border-primary text-primary dark:border-slate-100 dark:text-slate-100 font-bold rounded-xl hover:bg-primary hover:text-white transition-all">
          Chi tiết dự án
        </button>
      </div>
    </div>
  );
}
