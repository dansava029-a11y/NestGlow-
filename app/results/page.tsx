'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang, t } from '@/lib/i18n';
import BundleCard from '@/components/BundleCard';
import Loader from '@/components/Loader';

interface Bundle {
  bundle_name: string;
  style_label: string;
  total_price: number;
  monthly?: number;
  style_tip?: string;
  items: Array<{
    product_id: string;
    name: string;
    price: number;
    category: string;
    reason?: string;
  }>;
}

type ModalState = 'none' | 'confirm' | 'enter';

export default function ResultsPage() {
  const [lang, _setLang] = useLang();
  const [bundles, setBundles] = useState<Bundle[] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [sending, setSending] = useState(false);
  const [modal, setModal] = useState<ModalState>('none');
  const [email, setEmail] = useState('');
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('nestglow_bundles');
    if (!stored) {
      router.push('/');
      return;
    }
    try {
      setBundles(JSON.parse(stored));
    } catch {
      router.push('/');
    }
    const storedEmail = localStorage.getItem('nestglow_email');
    if (storedEmail) {
      setSavedEmail(storedEmail);
      setEmail(storedEmail);
    }
  }, [router]);

  const strings = t[lang];

  const handleGetRoom = () => {
    if (savedEmail) {
      setModal('confirm');
    } else {
      setModal('enter');
    }
  };

  const handleSend = async (emailToSend: string) => {
    if (!bundles) return;
    setSending(true);
    setSendError(null);

    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToSend,
          bundle: bundles[activeIndex],
          lang,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Save email for future use
      localStorage.setItem('nestglow_email', emailToSend);
      setSavedEmail(emailToSend);
      setModal('none');
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 5000);
    } catch (err: any) {
      setSendError(err.message || strings.error_msg);
    } finally {
      setSending(false);
    }
  };

  const handleStartOver = () => {
    localStorage.removeItem('nestglow_bundles');
    localStorage.removeItem('nestglow_email');
    router.push('/');
  };

  if (!bundles) {
    return <Loader visible lang={lang} />;
  }

  return (
    <main className="min-h-screen bg-bg page-enter">
      {/* Send Loader */}
      <Loader visible={sending} lang={lang} />

      {/* Top bar with back button */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-bg/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center">
          <button
            onClick={handleStartOver}
            className="flex items-center gap-2 text-accent hover:text-accent2 font-body text-sm font-medium transition-colors duration-200"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13L5 8l5-5" />
            </svg>
            {strings.start_over}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        {/* Hero heading */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-text-primary mb-3" style={{ fontSize: '3rem', lineHeight: '1.05' }}>
            {strings.results_title}
          </h1>
          <p className="font-body text-muted text-base">
            {lang === 'ru'
              ? 'Выберите стиль, который вам нравится'
              : 'Choose the style you love most'}
          </p>
        </div>

        {/* Success toast */}
        {sendSuccess && (
          <div className="bg-success/10 border border-success/30 text-success rounded-xl px-4 py-3 mb-6 font-body text-sm font-medium text-center">
            {strings.success_msg}
          </div>
        )}

        {/* Error toast */}
        {sendError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 font-body text-sm flex items-center justify-between">
            <span>{sendError}</span>
            <button
              className="ml-3 text-accent font-medium hover:text-accent2 transition-colors duration-200 flex-shrink-0"
              onClick={() => setSendError(null)}
            >
              {strings.retry}
            </button>
          </div>
        )}

        {/* Bundle Cards — 3 col desktop, stacked mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {bundles.map((bundle, i) => (
            <div
              key={i}
              className={`card-stagger-${i + 1} transition-all duration-300 ${
                activeIndex === i
                  ? 'scale-[1.03] md:scale-105'
                  : 'opacity-70 hover:opacity-90'
              }`}
            >
              <BundleCard
                bundle={bundle}
                isActive={activeIndex === i}
                onClick={() => setActiveIndex(i)}
                onGetRoom={handleGetRoom}
                lang={lang}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Confirm Email Modal */}
      {modal === 'confirm' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-card-hover p-8 w-full max-w-md animate-fadeInUp">
            <h3 className="font-heading text-text-primary mb-2" style={{ fontSize: '1.75rem' }}>
              {strings.get_room}
            </h3>
            <p className="text-muted font-body text-sm mb-4">
              {strings.confirm_email_msg}
            </p>
            <div className="bg-bg border border-border rounded-xl px-4 py-3 mb-6 font-body text-base text-text-primary">
              {savedEmail}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setModal('none')}
                className="btn-secondary flex-1 font-body text-sm"
              >
                {strings.close}
              </button>
              <button
                onClick={() => handleSend(savedEmail!)}
                className="btn-primary flex-1 font-body text-sm"
              >
                {strings.confirm_send}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enter Email Modal */}
      {modal === 'enter' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-card-hover p-8 w-full max-w-md animate-fadeInUp">
            <h3 className="font-heading text-text-primary mb-4" style={{ fontSize: '1.75rem' }}>
              {strings.enter_email}
            </h3>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={strings.email_placeholder}
              className="input-field font-body mb-6"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && email.includes('@') && handleSend(email)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setModal('none')}
                className="btn-secondary flex-1 font-body text-sm"
              >
                {strings.close}
              </button>
              <button
                onClick={() => handleSend(email)}
                disabled={!email.includes('@')}
                className={`btn-primary flex-1 font-body text-sm ${!email.includes('@') ? 'opacity-50 cursor-not-allowed hover:translate-y-0 hover:bg-accent' : ''}`}
              >
                {strings.send_btn}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
