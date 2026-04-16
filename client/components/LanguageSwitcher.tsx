"use client";

import { useTranslations, useLocale } from 'next-intl';
import { setUserLocale } from '@/services/locale';
import { useTransition } from 'react';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const t = useTranslations('Navigation');
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const toggleLanguage = () => {
    const nextLocale = locale === 'vi' ? 'en' : 'vi';
    startTransition(() => {
      setUserLocale(nextLocale);
    });
  };

  return (
    <button
      onClick={toggleLanguage}
      disabled={isPending}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors ${isPending ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      title={t('language')}
    >
      <Globe size={16} className="text-slate-500" />
      <span className="text-smallest font-bold text-slate-700 dark:text-slate-300">
        {locale === 'vi' ? 'VN' : 'EN'}
      </span>
    </button>
  );
}
