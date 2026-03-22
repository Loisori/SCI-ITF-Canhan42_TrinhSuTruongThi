import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10 dark:border-white/10 font-display">
      <div className="wrapper wrapper--lg">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary dark:text-slate-100 text-h4">
              rocket_launch
            </span>
            <h1 className="text-h6 font-extrabold tracking-tight text-primary dark:text-slate-100">
              InvestPro
            </h1>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-smaller font-semibold hover:text-primary/70 dark:hover:text-slate-300 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/projects"
              className="text-smaller font-semibold hover:text-primary/70 dark:hover:text-slate-300 transition-colors"
            >
              Dự án
            </Link>
            <Link
              href="/procedure"
              className="text-smaller font-semibold hover:text-primary/70 dark:hover:text-slate-300 transition-colors"
            >
              Quy trình
            </Link>
            <Link
              href="/aboutus"
              className="text-smaller font-semibold hover:text-primary/70 dark:hover:text-slate-300 transition-colors"
            >
              Về chúng tôi
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <Link href="/login" className="hidden sm:block px-4 py-2 text-smaller font-bold text-primary dark:text-slate-100 hover:bg-primary/5 dark:hover:bg-white/5 rounded-lg transition-colors">
              Đăng nhập
            </Link>
            <button className="px-5 py-2 text-smaller font-bold bg-primary dark:bg-slate-100 dark:text-primary text-white rounded-lg hover:shadow-lg transition-all">
              Bắt đầu ngay
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
