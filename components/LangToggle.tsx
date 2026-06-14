'use client';

import { useLang } from '@/lib/i18n';

export default function LangToggle() {
  const [lang, setLang] = useLang();

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-1 bg-surface border border-border rounded-btn px-4 py-2 shadow-card">
      <button
        onClick={() => setLang('en')}
        className={`text-small font-body transition-all duration-200 px-1 ${
          lang === 'en'
            ? 'font-bold text-text-primary'
            : 'font-normal text-muted hover:text-text-primary'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <span className="text-muted text-small">/</span>
      <button
        onClick={() => setLang('ru')}
        className={`text-small font-body transition-all duration-200 px-1 ${
          lang === 'ru'
            ? 'font-bold text-text-primary'
            : 'font-normal text-muted hover:text-text-primary'
        }`}
        aria-label="Switch to Russian"
      >
        RU
      </button>
    </div>
  );
}
