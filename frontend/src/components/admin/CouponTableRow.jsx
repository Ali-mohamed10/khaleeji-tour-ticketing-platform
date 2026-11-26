/**
 * CouponTableRow Component
 *
 * Purpose: Render a single row in the coupons table.
 * Inputs: coupon, isAr, copiedId, onCopy, onToggleStatus, onDelete, isTogglePending
 */
import { useTranslation } from 'react-i18next';
import {
  Copy,
  Check,
  Percent,
  CheckCircle2,
  XCircle,
  Trash2,
} from 'lucide-react';

export const CouponTableRow = ({
  coupon,
  isAr,
  copiedId,
  onCopy,
  onToggleStatus,
  onDelete,
  isTogglePending,
}) => {
  const { t } = useTranslation();
  const isExpired = coupon.expires_at && new Date(coupon.expires_at) <= new Date();
  const eventTitle = coupon.events
    ? isAr && coupon.events.title_ar
      ? coupon.events.title_ar
      : coupon.events.title_en
    : null;

  return (
    <tr className="hover:bg-secondary/10 transition-colors">
      {/* Code & Copy */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm text-foreground tracking-wider bg-secondary/30 px-2.5 py-1 rounded-lg border border-border">
            {coupon.code}
          </span>
          <button
            type="button"
            onClick={() => onCopy(coupon.id, coupon.code)}
            className="p-1.5 rounded hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={t('admin.coupons.copyCode', 'Copy Code')}
          >
            {copiedId === coupon.id ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </td>

      {/* Discount Badge */}
      <td className="px-4 py-3.5">
        <span className="inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
          <Percent className="w-3 h-3" />
          {coupon.discount_percent}% OFF
        </span>
      </td>

      {/* Event Scope */}
      <td className="px-4 py-3.5">
        {Array.isArray(coupon.event_ids) && coupon.event_ids.length > 1 ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
            🎟️ {t('admin.coupons.multipleEvents', '{{count}} Events', { count: coupon.event_ids.length })}
          </span>
        ) : coupon.event_id && eventTitle ? (
          <span className="text-foreground font-semibold inline-flex items-center gap-1">
            🎟️ <span className="truncate max-w-[180px]">{eventTitle}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-secondary/30 text-foreground border border-border">
            🌟 {t('admin.coupons.allEvents', 'All Events')}
          </span>
        )}
      </td>

      {/* Usage / Max */}
      <td className="px-4 py-3.5 font-mono">
        <span className="font-bold text-foreground">{coupon.used_count || 0}</span>
        <span className="text-muted-foreground/60"> / {coupon.max_uses ? coupon.max_uses : '∞'}</span>
      </td>

      {/* Expiration */}
      <td className="px-4 py-3.5 text-[11px]">
        {isExpired ? (
          <span className="text-destructive font-semibold">
            {t('admin.coupons.statusExpired', 'Expired')}
          </span>
        ) : coupon.expires_at ? (
          new Date(coupon.expires_at).toLocaleDateString()
        ) : (
          t('admin.coupons.neverExpires', 'Never')
        )}
      </td>

      {/* Active Toggle */}
      <td className="px-4 py-3.5 text-center">
        <button
          type="button"
          onClick={() => onToggleStatus(coupon.id, !coupon.is_active)}
          disabled={isTogglePending}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
            coupon.is_active
              ? 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border border-emerald-500/30'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted/60 border border-border'
          }`}
        >
          {coupon.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          <span>
            {coupon.is_active
              ? t('admin.coupons.statusActive', 'Active')
              : t('admin.coupons.statusInactive', 'Inactive')}
          </span>
        </button>
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5 text-right">
        <button
          type="button"
          onClick={() => onDelete(coupon)}
          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};
