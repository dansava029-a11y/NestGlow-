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

  const OptionCard = ({
    label,
    value: _value,
    selected,
    onSelect,
    multi = false,
  }: {
    label: string;
    value: string; // passed for key/identification by parent
    selected: boolean;
    onSelect: () => void;
    multi?: boolean;
  }) => (
    <button
      onClick={onSelect}
      className={`
        w-full text-left p-4 rounded-card border transition-all duration-200
        font-body text-body
        ${selected
          ? 'border-accent bg-accent/10 text-text-primary font-medium shadow-card'
          : 'border-border bg-surface text-text-primary hover:border-accent hover:bg-accent/5'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`
          w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200
          ${selected ? 'border-accent bg-accent' : 'border-border'}
        `}>
          {selected && (
            <div className={`${multi ? 'w-2 h-1.5 border-b-2 border-r-2 border-white rotate-45 mb-0.5' : 'w-2 h-2 rounded-full bg-white'}`} />
          )}
        </div>
        {label}
      </div>
    </button>
  );

  const progressPercent = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-surface rounded-card shadow-card-hover border border-border overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-h3 text-text-primary">
              {strings.quiz_label}
            </h3>
            <button
              onClick={onClose}
              className="text-muted hover:text-text-primary transition-colors duration-200 text-xl"
              aria-label={strings.close}
            >
              ✕
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-400 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-muted text-small font-body whitespace-nowrap">
              {step} {strings.step_of} {TOTAL_STEPS}
            </span>
          </div>
        </div>

        {/* Content */}
        <div
          className={`p-6 transition-all duration-150 ${slideDir === 'in' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
        >
          {step === 1 && (
            <div className="space-y-3">
              <p className="font-body text-body text-text-primary font-medium mb-4">
                {strings.q1_label}
              </p>
              {[strings.q1_opt1, strings.q1_opt2, strings.q1_opt3, strings.q1_opt4].map((opt) => (
                <OptionCard
                  key={opt}
                  label={opt}
                  value={opt}
                  selected={data.occasion === opt}
                  onSelect={() => setData(d => ({ ...d, occasion: opt }))}
                />
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="font-body text-body text-text-primary font-medium mb-4">
                {strings.q2_label}
              </p>
              {[strings.q2_opt1, strings.q2_opt2, strings.q2_opt3, strings.q2_opt4].map((opt) => (
                <OptionCard
                  key={opt}
                  label={opt}
                  value={opt}
                  selected={data.budget === opt}
                  onSelect={() => setData(d => ({ ...d, budget: opt }))}
                />
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="font-body text-body text-text-primary font-medium mb-4">
                {strings.q3_label}
              </p>
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
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <p className="font-body text-body text-text-primary font-medium mb-4">
                {strings.q4_label}
              </p>
              {[strings.q4_opt1, strings.q4_opt2, strings.q4_opt3, strings.q4_opt4].map((opt) => (
                <OptionCard
                  key={opt}
                  label={opt}
                  value={opt}
                  selected={data.room === opt}
                  onSelect={() => setData(d => ({ ...d, room: opt }))}
                />
              ))}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <p className="font-body text-body text-text-primary font-medium">
                {strings.q5_label}
              </p>
              <input
                type="email"
                value={data.email}
                onChange={e => setData(d => ({ ...d, email: e.target.value }))}
                placeholder={strings.email_placeholder}
                className="input-field font-body"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="p-6 border-t border-border flex items-center justify-between">
          <button
            onClick={step === 1 ? onClose : goBack}
            className="btn-secondary text-small"
          >
            {step === 1 ? strings.close : strings.quiz_back}
          </button>

          {step < TOTAL_STEPS ? (
            <button
              onClick={goNext}
              disabled={!canProceed()}
              className={`btn-primary text-small transition-all duration-200 ${!canProceed() ? 'opacity-50 cursor-not-allowed hover:translate-y-0' : ''}`}
            >
              {strings.quiz_next}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed()}
              className={`btn-primary text-small transition-all duration-200 ${!canProceed() ? 'opacity-50 cursor-not-allowed hover:translate-y-0' : ''}`}
            >
              {strings.quiz_submit}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
