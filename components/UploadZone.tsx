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
        relative w-full min-h-[280px] rounded-card border-2 border-dashed cursor-pointer
        flex flex-col items-center justify-center overflow-hidden
        transition-all duration-200
        ${isDragging
          ? 'border-accent bg-accent/5 scale-[1.02]'
          : preview
          ? 'border-border bg-surface'
          : 'border-border bg-surface hover:border-accent hover:bg-accent/5'
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
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
            <div className="text-white text-center">
              <div className="text-3xl mb-2">📷</div>
              <p className="font-body text-small font-medium">
                {strings.upload_label}
              </p>
            </div>
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-2xl">
            📷
          </div>
          <div>
            <p className="font-body text-body font-medium text-text-primary">
              {strings.upload_label}
            </p>
            <p className="font-body text-small text-muted mt-1">
              {strings.upload_sub}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
