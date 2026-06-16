'use client';

import { useState } from 'react';
import { t, Lang } from '@/lib/i18n';

interface QuizData {
  occasion: string;
  budget: string;
  feelings: string[];
  room: string;
  email: string;
}

interface QuizProps {
  onSubmit: (data: QuizData) => void;
  onClose: () => void;
  lang: Lang;
}

const TOTAL_STEPS = 5;

export default function Quiz({ onSubmit, onClose, lang }: QuizProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<QuizData>({
    occasion: '',
    budget: '',
    feelings: [],
    room: '',
    email: '',
  });
  const [slideDir, setSlideDir] = useState<'in' | 'out'>('in');
  const strings = t[lang];

  const goNext = () => {
    setSlideDir('out');
    setTimeout(() => {
      setStep(s => Math.min(s + 1, TOTAL_STEPS));
      setSlideDir('in');
    }, 150);
  };

  const goBack = () => {
    setSlideDir('out');
    setTimeout(() => {
      setStep(s => Math.max(s - 1, 1));
      setSlideDir('in');
    }, 150);
  };

  const handleSubmit = () => {
    onSubmit(data);
  };

  const canProceed = () => {
    if (step === 1) return !!data.occasion;
    if (step === 2) return !!data.budget;
    if (step === 3) return data.feelings.length > 0;
    if (step === 4) return !!data.room;
    if (step === 5) return !!data.email && data.email.includes('@');
    return false;
  };

  const progressPercent = (step / TOTAL_STEPS) * 100;

  const OptionCard = ({
    label,
    value: _value,
    selected,
    onSelect,
    multi = false,
  }: {
    label: string;
    value: string;
    selected: boolean;
    onSelect: () => void;
    multi?: boolean;
  }) => (
    <button
      onClick={onSelect}
      className={`
        w-full text-left rounded-xl border transition-all duration-200
        font-body
        ${selected
          ? 'border-accent bg-accent/10 text-text-primary shadow-card'
          : 'border-border bg-bg text-text-primary hover:border-accent/50 hover:bg-accent/5'
        }
      `}
      style={{ minHeight: '64px', padding: '14px 16px' }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-base leading-snug">{label}</span>
        {/* Checkmark on right */}
        <div className={`
          w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200
          ${selected ? 'border-accent bg-accent' : 'border-border'}
        `}>
          {selected && (
            multi
              ? (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L4 7L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )
              : <div className="w-2 h-2 rounded-full bg-white" />
          )}
        </div>
      </div>
    </button>
  );

  const getQuestion = () => {
    if (step === 1) return strings.q1_label;
    if (step === 2) return strings.q2_label;
    if (step === 3) return strings.q3_label;
    if (step === 4) return strings.q4_label;
    return strings.q5_label;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface">
      {/* Progress bar — very top thin line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-border z-10">
        <div
          className="h-full bg-accent transition-all duration-400 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Top bar: step indicator + close */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
        <div className="text-muted font-body text-sm">
          {lang === 'ru' ? 'Шаг' : 'Step'} {step} {strings.step_of} {TOTAL_STEPS}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-border transition-colors duration-200 text-muted hover:text-text-primary"
          aria-label={strings.close}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="1" y1="1" x2="13" y2="13" />
            <line x1="13" y1="1" x2="1" y2="13" />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-8">
          {/* Question in Cormorant 32px centered */}
          <h2 className="font-heading text-text-primary text-center mb-8" style={{ fontSize: '2rem', lineHeight: '1.2' }}>
            {getQuestion()}
          </h2>

          {/* Options */}
          <div
            className={`space-y-3 transition-all duration-150 ${slideDir === 'in' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
          >
            {step === 1 && (
              <>
                {[strings.q1_opt1, strings.q1_opt2, strings.q1_opt3, strings.q1_opt4].map((opt) => (
                  <OptionCard
                    key={opt}
                    label={opt}
                    value={opt}
                    selected={data.occasion === opt}
                    onSelect={() => setData(d => ({ ...d, occasion: opt }))}
                  />
                ))}
              </>
            )}

            {step === 2 && (
              <>
                {[strings.q2_opt1, strings.q2_opt2, strings.q2_opt3, strings.q2_opt4].map((opt) => (
                  <OptionCard
                    key={opt}
                    label={opt}
                    value={opt}
                    selected={data.budget === opt}
                    onSelect={() => setData(d => ({ ...d, budget: opt }))}
                  />
                ))}
              </>
            )}

            {step === 3 && (
              <>
                {[strings.q3_opt1, strings.q3_opt2, strings.q3_opt3, strings.q3_opt4].map((opt) => (
                  <OptionCard
                    key={opt}
                    label={opt}
                    value={opt}
                    selected={data.feelings.includes(opt)}
                    onSelect={() => {
                      setData(d => ({
                        ...d,
                        feelings: d.feelings.includes(opt)
                          ? d.feelings.filter(f => f !== opt)
                          : [...d.feelings, opt]
                      }));
                    }}
                    multi
                  />
                ))}
              </>
            )}

            {step === 4 && (
              <>
                {[strings.q4_opt1, strings.q4_opt2, strings.q4_opt3, strings.q4_opt4].map((opt) => (
                  <OptionCard
                    key={opt}
                    label={opt}
                    value={opt}
                    selected={data.room === opt}
                    onSelect={() => setData(d => ({ ...d, room: opt }))}
                  />
                ))}
              </>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <input
                  type="email"
                  value={data.email}
                  onChange={e => setData(d => ({ ...d, email: e.target.value }))}
                  placeholder={strings.email_placeholder}
                  className="input-field font-body text-base"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && canProceed() && handleSubmit()}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom navigation — Back | Next */}
      <div className="flex-shrink-0 border-t border-border px-6 py-5 flex items-center justify-between gap-4 bg-surface">
        <button
          onClick={step === 1 ? onClose : goBack}
          className="btn-secondary font-body text-sm flex-1"
        >
          {step === 1 ? strings.close : strings.quiz_back}
        </button>

        {step < TOTAL_STEPS ? (
          <button
            onClick={goNext}
            disabled={!canProceed()}
            className={`btn-primary font-body text-sm flex-1 transition-all duration-200 ${!canProceed() ? 'opacity-50 cursor-not-allowed hover:translate-y-0' : ''}`}
          >
            {strings.quiz_next}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceed()}
            className={`btn-primary font-body text-sm flex-1 transition-all duration-200 ${!canProceed() ? 'opacity-50 cursor-not-allowed hover:translate-y-0' : ''}`}
          >
            {strings.quiz_submit}
          </button>
        )}
      </div>
    </div>
  );
}
