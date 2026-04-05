
//services
import Link from "next/link";
export default function Hero() {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden bg-background-light dark:bg-background-dark">
      <div className="wrapper wrapper--lg relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-smallest font-bold bg-primary/10 text-primary dark:bg-white/10 dark:text-slate-100 w-fit">
              Nền tảng đầu tư hàng đầu Việt Nam
            </span>
            <h2 className="text-h2 lg:text-[7.2rem] font-black leading-[1.1] text-primary dark:text-slate-100">
              Đầu tư thông minh, <br />
              <span className="opacity-60">Kiến tạo tương lai</span>
            </h2>
            <p className="text-body text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed font-display">
              Nền tảng kết nối nhà đầu tư với những dự án tiềm năng nhất để tối
              ưu hóa lợi nhuận và xây dựng giá trị bền vững.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/projects"
                className="block px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-xl hover:translate-y-[-2px] transition-all"
              >
                Khám phá dự án
              </Link>
              <button className="px-8 py-4 bg-white dark:bg-white/5 border border-primary/10 font-bold rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined">play_circle</span>{" "}
                Xem quy trình
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 to-sky-500/20 dark:from-slate-800 dark:to-primary/20 border border-primary/10 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.2),transparent_45%)]" />
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 dark:bg-primary/90 backdrop-blur p-6 rounded-2xl shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-smallest font-bold uppercase text-slate-500">
                    Tăng trưởng năm nay
                  </p>
                  <p className="text-h5 font-black text-primary dark:text-white">
                    +24.5%
                  </p>
                </div>
                <span className="material-symbols-outlined !text-h3 text-green-500">
                  trending_up
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
