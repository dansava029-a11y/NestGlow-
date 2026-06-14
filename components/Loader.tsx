'use client';

import { useEffect, useState } from 'react';
import { t, Lang } from '@/lib/i18n';

interface LoaderProps {
  visible: boolean;
  lang: Lang;
}

const MESSAGES_KEYS: Array<keyof typeof t.en> = ['analyzing', 'matching', 'curating', 'almost'];

export default function Loader({ visible, lang }: LoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    if (!visible) {
      setMessageIndex(0);
      setShowTimeout(false);
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % MESSAGES_KEYS.length);
    }, 3000);

    const timeout = setTimeout(() => {
      setShowTimeout(true);
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [visible]);

  if (!visible) return null;

  const strings = t[lang];
  const currentMessage = strings[MESSAGES_KEYS[messageIndex]] as string;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-8">
        {/* Animated dots */}
        <div className="flex items-center gap-3">
          <div
            className="loader-dot w-4 h-4 rounded-full bg-accent"
          />
          <div
            className="loader-dot w-4 h-4 rounded-full bg-accent"
          />
          <div
            className="loader-dot w-4 h-4 rounded-full bg-accent"
          />
        </div>

        {/* Rotating message */}
        <div className="text-center">
          <p className="text-text-primary font-body text-body font-medium transition-all duration-300">
            {currentMessage}
          </p>
          {showTimeout && (
            <p className="text-muted text-small mt-2">
              {strings.timeout_msg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
