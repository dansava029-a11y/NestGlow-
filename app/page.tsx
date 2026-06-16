'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLang, t } from '@/lib/i18n';
import UploadZone from '@/components/UploadZone';
import Quiz from '@/components/Quiz';
import Loader from '@/components/Loader';

function formatBudget(v: number) {
  return `₽${v.toLocaleString('ru-RU')}`;
}

export default function Home() {
  const [lang, _setLang] = useLang();
  const [photo, setPhoto] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [budget, setBudget] = useState(150000);
  const [quizData, setQuizData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryFn, setRetryFn] = useState<(() => void) | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const router = useRouter();
  const s = t[lang];

  const fetchWithTimeout = async (url: string, options: RequestInit, ms = 60000) => {
    abortRef.current = new AbortController();
    const timer = setTimeout(() => abortRef.current?.abort(), ms);
    try {
      const res = await fetch(url, { ...options, signal: abortRef.current.signal });
      clearTimeout(timer);
      return res;
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') throw new Error(s.timeout_msg);
      throw err;
    }
  };

  const runFlow = async (photoData: string | null, quizAnswers: any) => {
    setLoading(true);
    setError(null);
    try {
      let roomData = null;
      let styleProfile = null;
      let detectedBudget = budget;

      if (photoData) {
        const res = await fetchWithTimeout('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: photoData }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        roomData = data;
      } else if (quizAnswers) {
        const res = await fetchWithTimeout('/api/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quizAnswers),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        styleProfile = data;
        if (styleProfile.budget_max) detectedBudget = styleProfile.budget_max;
        if (quizAnswers.email) localStorage.setItem('nestglow_email', quizAnswers.email);
      }

      const primaryStyle = roomData?.current_style || styleProfile?.detected_style || 'modern';
      const bundleRes = await fetchWithTimeout('/api/bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style: primaryStyle, budget: detectedBudget, roomData, quizData: styleProfile }),
      });
      const bundles = await bundleRes.json();
      if (bundles.error) throw new Error(bundles.error);
      localStorage.setItem('nestglow_bundles', JSON.stringify(bundles));
      router.push('/results');
    } catch (err: any) {
      setError(err.message || s.error_msg);
      const retry = () => runFlow(photoData, quizAnswers);
      setRetryFn(() => retry);
    } finally {
      setLoading(false);
    }
  };

  const handleCTA = () => { if (photo || quizData) runFlow(photo, quizData); };
  const handleQuizSubmit = (answers: any) => { setShowQuiz(false); setQuizData(answers); runFlow(null, answers); };
  const canProceed = !!photo || !!quizData;
  const pct = ((budget - 15000) / 485000) * 100;

  return (
    <main className="min-h-screen bg-bg">
      <Loader visible={loading} lang={lang} />
      {showQuiz && <Quiz onSubmit={handleQuizSubmit} onClose={() => setShowQuiz(false)} lang={lang} />}

      {/* ── HERO ── */}
      <section className="hero-section relative w-full overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1400&q=85"
          alt="Cozy living room"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        {/* Gradient: subtle top, strong bottom */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.05) 35%, rgba(26,16,8,0.82) 100%)' }}
        />

        {/* Brand + tagline — bottom of photo */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 max-w-2xl">
          <p className="font-body text-white/55 text-[10px] tracking-[0.25em] uppercase mb-3">
            Interior AI
          </p>
          <h1
            className="font-heading text-white"
            style={{ fontSize: 'clamp(56px, 15vw, 96px)', lineHeight: 0.95, letterSpacing: '-0.025em' }}
          >
            Nestglow
          </h1>
          <p className="font-body text-white/70 mt-3 leading-snug max-w-xs" style={{ fontSize: '0.9rem' }}>
            {s.hero_sub}
          </p>
        </div>
      </section>

      {/* ── ACTION PANEL ── */}
      <section className="relative bg-bg px-5 pt-7 pb-10 max-w-lg mx-auto lg:max-w-xl">

        {/* Upload zone */}
        <UploadZone
          onUpload={(b64) => { setPhoto(b64); setQuizData(null); }}
          lang={lang}
          preview={photo}
        />

        {/* OR divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted text-[11px] font-body px-1 tracking-wide">
            {lang === 'ru' ? 'или' : 'or'}
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Quiz entry row */}
        <button
          onClick={() => setShowQuiz(true)}
          className="quiz-row w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-200 text-left"
          style={{
            background: quizData ? 'rgba(74,140,106,0.06)' : 'var(--surface)',
            borderColor: quizData ? 'rgba(74,140,106,0.35)' : 'var(--border)',
          }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(196,113,74,0.1)' }}>
            {quizData ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l4 4 6-7" stroke="#4A8C6A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <span className="font-heading text-accent font-bold text-xl" style={{ lineHeight: 1 }}>5</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-body text-sm font-semibold text-text-primary block">
              {quizData
                ? (lang === 'ru' ? 'Квиз пройден — изменить' : 'Quiz done — change')
                : s.quiz_label}
            </span>
            {!quizData && (
              <span className="font-body text-xs text-muted block mt-0.5">{s.quiz_sub}</span>
            )}
          </div>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="flex-shrink-0 text-muted">
            <path d="M5.5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Budget slider */}
        <div className="mt-4 px-4 py-4 rounded-xl border border-border" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-body text-sm font-medium text-text-primary">{s.budget_label}</span>
            <span className="font-heading text-accent font-bold" style={{ fontSize: '1.4rem', lineHeight: 1 }}>
              {formatBudget(budget)}
            </span>
          </div>
          <input
            type="range"
            min={15000}
            max={500000}
            step={5000}
            value={budget}
            onChange={e => setBudget(Number(e.target.value))}
            className="nestglow-range w-full"
            style={{
              '--pct': `${pct}%`,
            } as React.CSSProperties}
          />
          <div className="flex justify-between mt-2 font-body" style={{ fontSize: '11px', color: 'var(--muted)' }}>
            <span>₽15 000</span>
            <span>₽500 000</span>
          </div>
        </div>

        {/* Error toast */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-red-700 font-body text-sm">{error}</p>
            {retryFn && (
              <button onClick={() => retryFn()} className="text-accent font-body text-sm font-semibold flex-shrink-0">
                {s.retry}
              </button>
            )}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleCTA}
          disabled={!canProceed || loading}
          className="cta-btn w-full mt-5 rounded-full font-body font-semibold text-white transition-all duration-200"
          style={{
            height: '56px',
            fontSize: '1rem',
            letterSpacing: '0.01em',
            background: canProceed && !loading
              ? 'linear-gradient(135deg, #C4714A 0%, #D4845D 100%)'
              : 'rgba(196,113,74,0.38)',
            boxShadow: canProceed && !loading
              ? '0 6px 24px rgba(196,113,74,0.38), 0 2px 8px rgba(196,113,74,0.2)'
              : 'none',
            cursor: canProceed && !loading ? 'pointer' : 'not-allowed',
          }}
        >
          {s.cta}
        </button>

        {!canProceed && (
          <p className="text-center font-body mt-2.5" style={{ fontSize: '12px', color: 'var(--muted)' }}>
            {lang === 'ru' ? 'Загрузите фото или пройдите квиз' : 'Upload a photo or take the quiz'}
          </p>
        )}
      </section>
    </main>
  );
}
