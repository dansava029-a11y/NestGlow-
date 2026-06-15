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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="font-heading text-h1 text-text-primary leading-tight">
              {strings.results_title}
            </h1>
          </div>
          <button
            onClick={handleStartOver}
            className="btn-secondary font-body text-small flex-shrink-0"
          >
            {strings.start_over}
          </button>
        </div>

        {/* Success toast */}
        {sendSuccess && (
          <div className="bg-success/10 border border-success/30 text-success rounded-card px-4 py-3 mb-6 font-body text-small font-medium">
            {strings.success_msg}
          </div>
        )}

        {/* Error toast */}
        {sendError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-card px-4 py-3 mb-6 font-body text-small">
            {sendError}
            <button
              className="ml-3 text-accent font-medium hover:text-accent2 transition-colors duration-200"
              onClick={() => setSendError(null)}
            >
              {strings.retry}
            </button>
          </div>
        )}

        {/* Bundle Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {bundles.map((bundle, i) => (
            <div
              key={i}
              className={`card-stagger-${i + 1}`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-card shadow-card-hover p-8 w-full max-w-md">
            <h3 className="font-heading text-h3 text-text-primary mb-2">
              {strings.get_room}
            </h3>
            <p className="text-muted font-body text-small mb-4">
              {strings.confirm_email_msg}
            </p>
            <div className="bg-bg border border-border rounded-input px-4 py-3 mb-6 font-body text-body text-text-primary">
              {savedEmail}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setModal('none')}
                className="btn-secondary flex-1 font-body text-small"
              >
                {strings.close}
              </button>
              <button
                onClick={() => handleSend(savedEmail!)}
                className="btn-primary flex-1 font-body text-small"
              >
                {strings.confirm_send}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enter Email Modal */}
      {modal === 'enter' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-card shadow-card-hover p-8 w-full max-w-md">
            <h3 className="font-heading text-h3 text-text-primary mb-4">
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
                className="btn-secondary flex-1 font-body text-small"
              >
                {strings.close}
              </button>
              <button
                onClick={() => handleSend(email)}
                disabled={!email.includes('@')}
                className={`btn-primary flex-1 font-body text-small ${!email.includes('@') ? 'opacity-50 cursor-not-allowed hover:translate-y-0 hover:bg-accent' : ''}`}
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
