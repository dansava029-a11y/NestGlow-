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
  const strings = t[lang];

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Strip data URL prefix, keep only base64
      const base64 = result.split(',')[1];
      onUpload(base64);
    };
    reader.readAsDataURL(file);
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative w-full min-h-[220px] rounded-xl cursor-pointer
        flex flex-col items-center justify-center overflow-hidden
        transition-all duration-200
        ${preview
          ? 'border-0'
          : isDragging
          ? 'border-2 border-dashed border-accent bg-accent/5 scale-[1.01]'
          : 'border-2 border-dashed border-border bg-surface/50 hover:border-accent/60 hover:bg-accent/3'
        }
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label={strings.upload_label}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {preview ? (
        /* Preview mode */
        <>
          <img
            src={`data:image/jpeg;base64,${preview}`}
            alt="Room preview"
            className="w-full h-full object-cover absolute inset-0"
            style={{ minHeight: '220px' }}
          />
          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
          {/* Hover overlay with change button */}
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black/30">
            <div className="bg-white/95 rounded-full px-5 py-2.5 flex items-center gap-2 shadow-lg">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#C4714A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11.5 2.5a2.121 2.121 0 013 3L5 15l-4 1 1-4L11.5 2.5z" />
              </svg>
              <span className="font-body text-sm font-semibold text-text-primary">
                {lang === 'ru' ? 'Изменить фото' : 'Change photo'}
              </span>
            </div>
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          {/* Plus-in-circle SVG icon */}
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#C4714A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="14" cy="14" r="12" />
              <line x1="14" y1="9" x2="14" y2="19" />
              <line x1="9" y1="14" x2="19" y2="14" />
            </svg>
          </div>
          <div>
            <p className="font-body font-semibold text-text-primary text-base">
              {strings.upload_label}
            </p>
            <p className="font-body text-sm text-muted mt-1">
              {strings.upload_sub}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
