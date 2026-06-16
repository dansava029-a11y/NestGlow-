'use client';

import { t, Lang } from '@/lib/i18n';

const CATEGORY_EMOJIS: Record<string, string> = {
  sofa: '🛋️',
  table: '☕',
  lamp: '💡',
  rug: '🪨',
  shelf: '📚',
  chair: '🪑',
  decor: '🌿',
};

interface BundleItem {
  product_id: string;
  name: string;
  price: number;
  category: string;
  reason?: string;
}

interface Bundle {
  bundle_name: string;
  style_label: string;
  total_price: number;
  monthly?: number;
  style_tip?: string;
  items: BundleItem[];
}

interface BundleCardProps {
  bundle: Bundle;
  isActive: boolean;
  onClick: () => void;
  onGetRoom: () => void;
  lang: Lang;
}

function formatPrice(price: number): string {
  return `₽${price.toLocaleString('ru-RU')}`;
}

export default function BundleCard({ bundle, isActive, onClick, onGetRoom, lang }: BundleCardProps) {
  const strings = t[lang];
  const monthlyStr = strings.monthly.replace('{amount}', (bundle.monthly || Math.round(bundle.total_price / 12)).toLocaleString('ru-RU'));

  return (
    <div
      onClick={onClick}
      className={`
        cursor-pointer select-none rounded-2xl bg-surface
        transition-all duration-300
        ${isActive
          ? 'border-2 border-accent shadow-[0_4px_24px_rgba(0,0,0,0.06)] ring-0'
          : 'border border-border shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:border-accent/40'
        }
      `}
      style={{ boxShadow: isActive ? '0 8px 40px rgba(196, 113, 74, 0.15)' : '0 4px 24px rgba(0,0,0,0.06)' }}
    >
      <div className="p-6">
        {/* Style badge top-left */}
        <div className="inline-block bg-accent text-white text-xs font-body font-semibold px-3 py-1 rounded-full mb-4 tracking-wide">
          {bundle.style_label}
        </div>

        {/* Bundle name in Cormorant 24px */}
        <h3 className="font-heading text-text-primary mb-1" style={{ fontSize: '1.5rem', lineHeight: '1.2' }}>
          {bundle.bundle_name}
        </h3>

        {/* Style tip italic muted */}
        {bundle.style_tip && (
          <p className="text-muted text-sm font-body mb-5 italic leading-snug">
            {bundle.style_tip}
          </p>
        )}

        {/* Items list */}
        <div className="space-y-2.5 mb-5">
          {bundle.items.map((item, i) => (
            <div
              key={`${item.product_id}-${i}`}
              className="flex items-center justify-between py-0.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base flex-shrink-0">
                  {CATEGORY_EMOJIS[item.category] || '•'}
                </span>
                <span className="font-body text-sm text-text-primary truncate">
                  {item.name}
                </span>
              </div>
              <span className="font-body text-sm text-muted flex-shrink-0 ml-3 tabular-nums">
                {formatPrice(item.price)}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-border my-4" />

        {/* Total row */}
        <div className="mb-5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted font-body">{strings.total}</span>
            <span className="font-heading text-accent" style={{ fontSize: '2rem', lineHeight: '1' }}>
              {formatPrice(bundle.total_price)}
            </span>
          </div>
          <p className="text-xs text-muted font-body mt-1 text-right">
            {monthlyStr}
          </p>
        </div>

        {/* Full-width CTA button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onGetRoom();
          }}
          className="btn-primary w-full text-center font-body text-sm"
        >
          {strings.get_room}
        </button>
      </div>
    </div>
  );
}
