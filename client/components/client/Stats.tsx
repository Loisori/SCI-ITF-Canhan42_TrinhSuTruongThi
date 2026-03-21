export default function Stats() {
  const stats = [
    { label: "Tổng vốn đầu tư", value: "$500M+" },
    { label: "Nhà đầu tư", value: "15,000+", border: true },
    { label: "Dự án thành công", value: "120+", border: true },
    { label: "ROI trung bình", value: "18%", border: true },
  ];

  return (
    <section className="py-12 bg-white dark:bg-primary/20">
      <div className="wrapper wrapper--lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`text-center ${stat.border ? "md:border-l border-slate-100 dark:border-white/10" : ""}`}
            >
              <p className="text-h3 font-black text-primary dark:text-slate-100">
                {stat.value}
              </p>
              <p className="text-smaller font-medium text-slate-500 mt-2 uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
