'use client';

import { useRef, useState, useCallback } from 'react';
import { t, Lang } from '@/lib/i18n';

interface UploadZoneProps {
  onUpload: (base64: string) => void;
  lang: Lang;
  preview: string | null;
}

export default function UploadZone({ onUpload, lang, preview }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const s = t[lang];

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onUpload(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      aria-label={s.upload_label}
      className="relative w-full overflow-hidden cursor-pointer select-none transition-all duration-200"
      style={{
        minHeight: preview ? '180px' : '148px',
        borderRadius: '14px',
        border: preview ? 'none' : `2px dashed ${isDragging ? '#C4714A' : '#D8D0C5'}`,
        background: preview ? 'transparent' : isDragging ? 'rgba(196,113,74,0.05)' : 'var(--surface)',
      }}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {preview ? (
        /* ── Preview state ── */
        <>
          <img
            src={`data:image/jpeg;base64,${preview}`}
            alt="Room preview"
            className="w-full h-full object-cover absolute inset-0"
            style={{ minHeight: '180px', borderRadius: '14px' }}
          />
          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-20 rounded-b-[14px]"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />
          {/* Change pill — always visible bottom */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/95 rounded-full px-4 py-2 shadow-md">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#C4714A" strokeWidth="1.8" strokeLinecap="round">
              <path d="M9 1.5a1.5 1.5 0 012 2L3.5 11.5 1 12l.5-2.5L9 1.5z" />
            </svg>
            <span className="font-body text-xs font-semibold text-text-primary">
              {lang === 'ru' ? 'Изменить фото' : 'Change photo'}
            </span>
          </div>
        </>
      ) : (
        /* ── Empty state ── */
        <div className="flex items-center gap-4 px-5 py-5">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(196,113,74,0.1)' }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#C4714A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="5" width="20" height="15" rx="3" />
              <circle cx="11" cy="12.5" r="3.5" />
              <path d="M7 5l1.5-3h5L15 5" />
            </svg>
          </div>
          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-body font-semibold text-text-primary" style={{ fontSize: '0.9rem' }}>
              {s.upload_label}
            </p>
            <p className="font-body text-muted mt-0.5" style={{ fontSize: '0.78rem' }}>
              {s.upload_sub}
            </p>
          </div>
          {/* Arrow */}
          <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(196,113,74,0.1)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#C4714A" strokeWidth="2" strokeLinecap="round">
              <path d="M2 7h10M7 2l5 5-5 5" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
