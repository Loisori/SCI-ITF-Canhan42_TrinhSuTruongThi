"use client";

//services
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!mounted) {
    return <div className="p-2 w-9 h-9" aria-hidden="true" />;
  }

  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = currentTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-all flex items-center justify-center border border-transparent dark:border-white/10"
      aria-label="Toggle Theme"
    >
      <span className="material-symbols-outlined text-[20px] text-primary dark:text-yellow-400">
        {isDark ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
