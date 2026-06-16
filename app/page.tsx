'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLang, t } from '@/lib/i18n';
import UploadZone from '@/components/UploadZone';
import Quiz from '@/components/Quiz';
import Loader from '@/components/Loader';

function formatBudget(value: number): string {
  return `₽${value.toLocaleString('ru-RU')}`;
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
  const strings = t[lang];

  const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = 60000) => {
    abortRef.current = new AbortController();
    const timeout = setTimeout(() => abortRef.current?.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: abortRef.current.signal });
      clearTimeout(timeout);
      return res;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error(strings.timeout_msg);
      }
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

      // Step 1: Analyze photo or process quiz
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
        // Extract budget from quiz if available
        if (styleProfile.budget_max) detectedBudget = styleProfile.budget_max;
        // Save email from quiz
        if (quizAnswers.email) {
          localStorage.setItem('nestglow_email', quizAnswers.email);
        }
      }

      // Step 2: Generate bundles
      const primaryStyle = roomData?.current_style || styleProfile?.detected_style || 'modern';
      const bundleRes = await fetchWithTimeout('/api/bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style: primaryStyle,
          budget: detectedBudget,
          roomData,
          quizData: styleProfile,
        }),
      });
      const bundles = await bundleRes.json();
      if (bundles.error) throw new Error(bundles.error);

      // Save and navigate
      localStorage.setItem('nestglow_bundles', JSON.stringify(bundles));
      router.push('/results');
    } catch (err: any) {
      setError(err.message || strings.error_msg);
      const retry = () => runFlow(photoData, quizAnswers);
      setRetryFn(() => retry);
    } finally {
      setLoading(false);
    }
  };

  const handleCTA = () => {
    if (!photo && !quizData) return;
    runFlow(photo, quizData);
  };

  const handleQuizSubmit = (answers: any) => {
    setShowQuiz(false);
    setQuizData(answers);
    // Auto-trigger flow
    runFlow(null, answers);
  };

  const canProceed = !!photo || !!quizData;

  return (
    <main className="min-h-screen bg-bg">
      {/* Loader */}
      <Loader visible={loading} lang={lang} />

      {/* Quiz Modal */}
      {showQuiz && (
        <Quiz
          onSubmit={handleQuizSubmit}
          onClose={() => setShowQuiz(false)}
          lang={lang}
        />
      )}

      {/* Desktop: two-column split. Mobile: stacked */}
      <div className="flex flex-col md:flex-row min-h-screen">

        {/* LEFT PANEL — Hero image */}
        {/* Mobile: top image block with overlay text */}
        <div className="relative md:sticky md:top-0 md:h-screen md:w-1/2 flex-shrink-0 overflow-hidden">
          {/* Mobile height */}
          <div className="relative w-full h-[50vh] md:h-full">
            <Image
              src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1400&q=80"
              alt="Cozy living room"
              fill
              priority
              className="object-cover animate-fadeIn"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* Mobile-only text over image */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:hidden">
              <div className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-body font-semibold px-3 py-1 rounded-full mb-3 tracking-widest uppercase">
                Interior AI
              </div>
              <h1 className="font-heading text-white leading-tight" style={{ fontSize: '2.5rem', lineHeight: '1.1' }}>
                {strings.hero_title}
              </h1>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Content */}
        <div className="flex-1 overflow-y-auto bg-bg">
          <div className="max-w-xl mx-auto px-6 md:px-10 py-12 md:py-16">

            {/* Desktop-only badge + heading */}
            <div className="hidden md:block mb-10">
              <div className="opacity-0-init animate-fadeInUp delay-100 inline-block bg-accent/10 text-accent text-xs font-body font-semibold px-4 py-1.5 rounded-full mb-6 tracking-widest uppercase">
                Interior AI
              </div>
              <h1 className="font-heading text-text-primary leading-tight mb-4" style={{ fontSize: '4.5rem', lineHeight: '1.05' }}>
                <span className="block opacity-0-init animate-fadeInUp delay-200">
                  {strings.hero_title.split('.')[0]}.
                </span>
                {strings.hero_title.split('.').length > 2 && (
                  <span className="block opacity-0-init animate-fadeInUp delay-300 text-accent">
                    {strings.hero_title.split('.')[1].trim()}.
                  </span>
                )}
                {strings.hero_title.split('.').length > 3 && (
                  <span className="block opacity-0-init animate-fadeInUp delay-400">
                    {strings.hero_title.split('.')[2].trim()}.
                  </span>
                )}
              </h1>
              <p className="font-body text-muted text-lg opacity-0-init animate-fadeInUp delay-300">
                {strings.hero_sub}
              </p>
            </div>

            {/* Mobile-only subtitle (image has heading) */}
            <p className="font-body text-muted text-base mb-8 md:hidden">
              {strings.hero_sub}
            </p>

            {/* Upload Zone */}
            <div className="opacity-0-init animate-fadeInUp delay-400 mb-5">
              <UploadZone
                onUpload={(base64) => {
                  setPhoto(base64);
                  setQuizData(null);
                }}
                lang={lang}
                preview={photo}
              />
            </div>

            {/* Quiz Entry Card */}
            <div
              onClick={() => setShowQuiz(true)}
              className={`
                opacity-0-init animate-fadeInUp delay-500
                relative rounded-xl border cursor-pointer overflow-hidden mb-5
                transition-all duration-200 hover:shadow-card-hover
                ${quizData
                  ? 'border-accent bg-accent/5'
                  : 'border-border bg-surface hover:border-accent/50'
                }
              `}
            >
              <div className="flex items-center gap-5 p-5">
                {/* Decorative serif number */}
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
                  <span className="font-heading text-accent" style={{ fontSize: '2rem', lineHeight: 1 }}>5</span>
                </div>

                <div className="flex-1 min-w-0">
                  {quizData ? (
                    <>
                      <p className="font-heading text-success text-xl mb-0.5">
                        {lang === 'ru' ? 'Квиз пройден!' : 'Quiz complete!'}
                      </p>
                      <p className="text-muted text-sm font-body">
                        {lang === 'ru' ? 'Нажмите чтобы изменить' : 'Click to change answers'}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-heading text-text-primary text-xl mb-0.5">
                        {strings.quiz_label}
                      </p>
                      <p className="font-body text-sm text-muted">
                        {strings.quiz_sub}
                      </p>
                    </>
                  )}
                </div>

                {/* Arrow icon */}
                <div className="flex-shrink-0 text-accent">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 10h12M10 4l6 6-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Budget Slider */}
            <div className="opacity-0-init animate-fadeInUp delay-600 rounded-xl border border-border bg-surface p-5 mb-7">
              <div className="flex items-center justify-between mb-3">
                <label className="font-body text-text-primary font-medium text-sm">
                  {strings.budget_label}
                </label>
                <span className="font-heading text-accent" style={{ fontSize: '1.5rem', lineHeight: 1 }}>
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
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #C4714A ${((budget - 15000) / (500000 - 15000)) * 100}%, #E8E0D5 ${((budget - 15000) / (500000 - 15000)) * 100}%)`,
                }}
              />
              <div className="flex justify-between mt-2 text-muted text-xs font-body">
                <span>₽15,000</span>
                <span>₽500,000</span>
              </div>
            </div>

            {/* Error toast */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex items-center justify-between">
                <p className="text-red-700 font-body text-sm">{error}</p>
                {retryFn && (
                  <button
                    onClick={() => retryFn()}
                    className="text-accent font-body text-sm font-medium hover:text-accent2 transition-colors duration-200 ml-4 flex-shrink-0"
                  >
                    {strings.retry}
                  </button>
                )}
              </div>
            )}

            {/* CTA Button */}
            <div className="opacity-0-init animate-fadeInUp delay-700">
              <button
                onClick={handleCTA}
                disabled={!canProceed || loading}
                className={`
                  w-full md:w-auto md:min-w-[280px] font-body font-semibold text-base text-white
                  rounded-full transition-all duration-200
                  flex items-center justify-center
                  ${canProceed && !loading
                    ? 'bg-accent hover:bg-accent2 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer'
                    : 'bg-accent/50 cursor-not-allowed'
                  }
                `}
                style={{ height: '56px', paddingLeft: '2rem', paddingRight: '2rem' }}
              >
                {strings.cta}
              </button>

              {!canProceed && (
                <p className="text-muted text-sm font-body mt-3">
                  {lang === 'ru'
                    ? 'Загрузите фото или пройдите квиз выше'
                    : 'Upload a photo or take the quiz above'}
                </p>
              )}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
