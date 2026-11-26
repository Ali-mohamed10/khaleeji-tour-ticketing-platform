/**
 * CouponInputSection Component
 *
 * Purpose: Promo / discount coupon code input and applied status badge.
 * Inputs: eventId, appliedCoupon, onApplyCoupon, onRemoveCoupon, disabled
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, X, Loader2, AlertCircle } from 'lucide-react';
import { couponService } from '../../services/couponService';

export const CouponInputSection = ({
  eventId,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleApply = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMessage(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage(t('checkout.coupon.emptyCode', 'Please enter a coupon code'));
      return;
    }

    setIsApplying(true);
    try {
      const result = await couponService.validateCoupon(cleanCode, eventId);
      if (result.valid) {
        onApplyCoupon?.(result);
        setCode('');
      } else {
        const msg = result.messageKey ? t(result.messageKey, result.message) : result.message;
        setErrorMessage(msg);
      }
    } catch {
      setErrorMessage(t('checkout.coupon.validationError', 'Failed to validate coupon'));
    } finally {
      setIsApplying(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleApply(e);
    }
  };

  const handleRemove = () => {
    setErrorMessage(null);
    onRemoveCoupon?.();
  };

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 animate-fade-in">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
            <Tag className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-xs text-foreground tracking-wider">
                {appliedCoupon.code}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-500">
                {t('checkout.coupon.discountTag', { percent: appliedCoupon.discountPercent })}
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {t('checkout.coupon.applied', 'Coupon Applied')}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRemove}
          disabled={disabled}
          className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors cursor-pointer"
          title={t('checkout.coupon.remove', 'Remove')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
            onKeyDown={handleKeyDown}
            placeholder={t('checkout.coupon.promoPlaceholder', 'Enter coupon code...')}
            disabled={disabled || isApplying}
            className="w-full bg-background border border-input rounded-xl pl-8 pr-3 py-2 text-xs font-mono uppercase tracking-wider text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
          />
        </div>
        <button
          type="button"
          onClick={handleApply}
          disabled={disabled || isApplying || !code.trim()}
          className="px-4 py-2 bg-secondary/30 hover:bg-primary hover:text-primary-foreground border border-border rounded-xl text-xs font-bold text-foreground transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:pointer-events-none shrink-0 shadow-2xs"
        >
          {isApplying ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <span>{t('checkout.coupon.applyBtn', 'Apply')}</span>
          )}
        </button>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-[11px] text-destructive px-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

export default CouponInputSection;
