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
        card p-6 cursor-pointer select-none
        transition-all duration-200
        ${isActive
          ? 'opacity-100 scale-[1.02] shadow-card-hover ring-2 ring-accent/30'
          : 'opacity-85 hover:opacity-95'
        }
      `}
    >
      {/* Style badge */}
      <div className="inline-block bg-accent text-white text-small font-body font-semibold px-3 py-1 rounded-btn mb-4">
        {bundle.style_label}
      </div>

      {/* Bundle name */}
      <h3 className="font-heading text-h3 text-text-primary mb-1">
        {bundle.bundle_name}
      </h3>

      {/* Style tip */}
      {bundle.style_tip && (
        <p className="text-muted text-small font-body mb-4 italic">
          💡 {bundle.style_tip}
        </p>
      )}

      {/* Items list */}
      <div className="space-y-2 mb-4">
        {bundle.items.map((item, i) => (
          <div
            key={`${item.product_id}-${i}`}
            className="flex items-center justify-between py-1"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base flex-shrink-0">
                {CATEGORY_EMOJIS[item.category] || '•'}
              </span>
              <span className="font-body text-small text-text-primary truncate">
                {item.name}
              </span>
            </div>
            <span className="font-body text-small text-muted flex-shrink-0 ml-2">
              {formatPrice(item.price)}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-border my-4" />

      {/* Total */}
      <div className="mb-4">
        <div className="text-small text-muted font-body mb-1">
          {strings.total}
        </div>
        <div className="font-heading text-h2 text-accent">
          {formatPrice(bundle.total_price)}
        </div>
        <div className="text-small text-muted font-body mt-1">
          {monthlyStr}
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onGetRoom();
        }}
        className="btn-primary w-full text-center font-body text-small"
      >
        {strings.get_room}
      </button>
    </div>
  );
}
