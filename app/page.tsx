'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
    <main className="min-h-screen bg-bg page-enter">
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="font-heading text-h1 text-text-primary mb-4 leading-tight">
            {strings.hero_title}
          </h1>
          <p className="font-body text-body text-muted max-w-md mx-auto">
            {strings.hero_sub}
          </p>
        </div>

        {/* Two columns: Upload | Quiz */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Upload Zone */}
          <div>
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
              card p-8 flex flex-col items-center justify-center text-center cursor-pointer min-h-[280px]
              ${quizData ? 'ring-2 ring-accent/30' : ''}
            `}
          >
            {quizData ? (
              <div className="space-y-3">
                <div className="text-4xl">✓</div>
                <p className="font-heading text-h3 text-success">
                  {lang === 'ru' ? 'Квиз пройден!' : 'Quiz complete!'}
                </p>
                <p className="text-muted text-small font-body">
                  {lang === 'ru' ? 'Нажмите чтобы изменить' : 'Click to change answers'}
                </p>
              </div>
            ) : (
              <>
                <div className="text-4xl mb-4">💬</div>
                <h2 className="font-heading text-h3 text-text-primary mb-2">
                  {strings.quiz_label}
                </h2>
                <p className="font-body text-small text-muted">
                  {strings.quiz_sub}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Budget Slider */}
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <label className="font-body text-body text-text-primary font-medium">
              {strings.budget_label}
            </label>
            <span className="font-heading text-h3 text-accent">
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
          <div className="flex justify-between mt-2 text-muted text-small font-body">
            <span>₽15,000</span>
            <span>₽500,000</span>
          </div>
        </div>

        {/* Error toast */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-card p-4 mb-6 flex items-center justify-between">
            <p className="text-red-700 font-body text-small">{error}</p>
            {retryFn && (
              <button
                onClick={() => retryFn()}
                className="text-accent font-body text-small font-medium hover:text-accent2 transition-colors duration-200 ml-4 flex-shrink-0"
              >
                {strings.retry}
              </button>
            )}
          </div>
        )}

        {/* CTA Button */}
        <div className="flex justify-center">
          <button
            onClick={handleCTA}
            disabled={!canProceed || loading}
            className={`btn-primary font-body text-body px-12 py-4 transition-all duration-200 ${
              !canProceed || loading ? 'opacity-50 cursor-not-allowed hover:translate-y-0 hover:bg-accent' : ''
            }`}
          >
            {strings.cta}
          </button>
        </div>

        {!canProceed && (
          <p className="text-center text-muted text-small font-body mt-3">
            {lang === 'ru'
              ? 'Загрузите фото или пройдите квиз выше'
              : 'Upload a photo or take the quiz above'}
          </p>
        )}
      </div>
    </main>
  );
}
