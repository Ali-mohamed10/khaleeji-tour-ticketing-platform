/**
 * CreateCouponModal Component
 *
 * Purpose: Luxury modal dialog for creating a new ticket discount coupon.
 * Features:
 *   - Multi-event checkbox selection with "All Events" global option
 *   - Rendered directly into document.body via createPortal (immune to parent transforms)
 *   - Background body-scroll locking with scrollbar layout shift prevention
 *   - Closes on Escape key and backdrop click
 *   - Fixed header and footer with scrollable body
 *   - Automatic uppercase coupon code normalization
 */
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  X,
  Tag,
  Percent,
  Calendar,
  Layers,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useCreateCoupon } from '../../hooks/useCoupons';

const PRESET_DISCOUNTS = [10, 15, 20, 25, 50];

export const CreateCouponModal = ({ isOpen, onClose, events = [] }) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const createCouponMutation = useCreateCoupon();
  const formScrollRef = useRef(null);

  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('20');
  const [isAllEvents, setIsAllEvents] = useState(true);
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState(null);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    // Reset form scroll to top on open
    if (formScrollRef.current) {
      formScrollRef.current.scrollTop = 0;
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleCodeChange = (e) => {
    const clean = e.target.value.toUpperCase().replace(/\s+/g, '');
    setCode(clean);
  };

  const toggleSelectAll = () => {
    setIsAllEvents(true);
    setSelectedEventIds([]);
  };

  const handleSelectAllEvents = () => {
    setIsAllEvents(false);
    setSelectedEventIds(events.map((e) => e.id));
  };

  const handleToggleEvent = (eventId) => {
    setIsAllEvents(false);
    setSelectedEventIds((prev) => {
      if (prev.includes(eventId)) {
        const next = prev.filter((id) => id !== eventId);
        if (next.length === 0) {
          setIsAllEvents(true);
        }
        return next;
      } else {
        return [...prev, eventId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!code || code.length < 2) {
      setFormError(t('admin.coupons.emptyCode', 'Coupon code must be at least 2 characters'));
      return;
    }

    const discountNum = parseFloat(discountPercent);
    if (isNaN(discountNum) || discountNum <= 0 || discountNum > 100) {
      setFormError(t('admin.coupons.invalidDiscount', 'Discount must be between 1% and 100%'));
      return;
    }

    if (!isAllEvents && selectedEventIds.length === 0) {
      setFormError(t('admin.coupons.noEventsSelected', 'Please select at least one event or choose All Events'));
      return;
    }

    try {
      await createCouponMutation.mutateAsync({
        code,
        discount_percent: discountNum,
        event_id: !isAllEvents && selectedEventIds.length === 1 ? selectedEventIds[0] : null,
        event_ids: !isAllEvents && selectedEventIds.length > 0 ? selectedEventIds : null,
        is_active: isActive,
        max_uses: maxUses ? parseInt(maxUses, 10) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        notes,
      });

      // Reset & close on success
      setCode('');
      setDiscountPercent('20');
      setIsAllEvents(true);
      setSelectedEventIds([]);
      setMaxUses('');
      setExpiresAt('');
      setNotes('');
      setIsActive(true);
      onClose();
    } catch (err) {
      setFormError(err.message || 'Failed to create coupon');
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-coupon-title"
    >
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* Fixed Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-coupon-title" className="text-base sm:text-lg font-bold text-foreground">
                {t('admin.coupons.modalTitle', 'Create Discount Coupon')}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t('admin.coupons.modalSubtitle', 'Configure code, percentage and event eligibility.')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="create-coupon-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 overscroll-contain" ref={formScrollRef}>
          {formError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Coupon Code Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center justify-between">
              <span>{t('admin.coupons.codeLabel', 'Coupon Code')} *</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                {t('admin.coupons.codeHint', 'Uppercase, no spaces')}
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                dir="ltr"
                value={code}
                onChange={handleCodeChange}
                placeholder={t('admin.coupons.codePlaceholder', 'e.g. SUMMER25, VIP50')}
                className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm font-mono font-bold tracking-wider text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all uppercase text-left"
                required
              />
              <Sparkles className="w-4 h-4 text-primary/60 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Discount Percentage */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              {t('admin.coupons.discountLabel', 'Discount Percentage (%)')} *
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="0.5"
                  dir="ltr"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  placeholder={t('admin.coupons.discountPlaceholder', 'e.g. 20')}
                  className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-semibold text-left"
                  required
                />
                <Percent className="w-4 h-4 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
              </div>

              {/* Quick preset chips */}
              <div className="flex items-center gap-1 shrink-0">
                {PRESET_DISCOUNTS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDiscountPercent(String(preset))}
                    className={`px-2.5 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      discountPercent === String(preset)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary/20 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Multi-Event Checkbox Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>{t('admin.coupons.eventLabel', 'Eligible Events')} *</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllEvents}
                  className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                >
                  {t('admin.coupons.selectAll', 'Select All')}
                </button>
                <span className="text-muted-foreground/40 text-[10px]">|</span>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-[11px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {t('admin.coupons.clearAll', 'Clear')}
                </button>
              </div>
            </div>

            {/* Checkbox List Box */}
            <div className="rounded-xl border border-input bg-background/50 p-2 space-y-1 max-h-48 overflow-y-auto overscroll-contain">
              {/* Option 1: All Events (Global) */}
              <label
                className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all cursor-pointer select-none ${
                  isAllEvents
                    ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-2xs'
                    : 'bg-transparent border-transparent hover:bg-secondary/30 text-foreground'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isAllEvents}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary/20 cursor-pointer accent-primary"
                />
                <span className="text-xs flex items-center gap-1.5 flex-1">
                  <span>🌟</span>
                  <span>{t('admin.coupons.allEventsOption', 'All Events (Global Ticket Discount)')}</span>
                </span>
              </label>

              {/* Individual Event Checkboxes */}
              {events.map((evt) => {
                const isChecked = !isAllEvents && selectedEventIds.includes(evt.id);
                const title = isAr && evt.title_ar ? evt.title_ar : evt.title_en || evt.slug;

                return (
                  <label
                    key={evt.id}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all cursor-pointer select-none ${
                      isChecked
                        ? 'bg-primary/10 border-primary/40 text-primary font-semibold'
                        : 'bg-transparent border-transparent hover:bg-secondary/30 text-foreground'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleEvent(evt.id)}
                      className="w-4 h-4 rounded border-input text-primary focus:ring-primary/20 cursor-pointer accent-primary"
                    />
                    <span className="text-xs flex items-center gap-1.5 flex-1 truncate">
                      <span>🎟️</span>
                      <span className="truncate">{title}</span>
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Selection Summary Indicator */}
            <div className="text-[11px] text-muted-foreground flex items-center justify-between px-1">
              <span>
                {isAllEvents
                  ? `🌟 ${t('admin.coupons.allEvents', 'All Events')}`
                  : t('admin.coupons.selectedEventsCount', {
                      count: selectedEventIds.length,
                      total: events.length,
                    })}
              </span>
            </div>
          </div>

          {/* Usage Limit & Expiration Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Max Uses Limit */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                {t('admin.coupons.maxUsesLabel', 'Max Usages')}
              </label>
              <input
                type="number"
                min="1"
                dir="ltr"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder={t('admin.coupons.maxUsesPlaceholder', 'Unlimited')}
                className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-left"
              />
            </div>

            {/* Expiration Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{t('admin.coupons.expiresAtLabel', 'Expires On')}</span>
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* Campaign Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              {t('admin.coupons.notesLabel', 'Notes / Campaign')}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('admin.coupons.notesPlaceholder', 'e.g. VIP Early Bird')}
              className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          {/* Active Immediately Switch */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-xs font-semibold text-foreground">
              {t('admin.coupons.activeLabel', 'Activate Immediately')}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>
        </form>

        {/* Fixed Footer */}
        <div className="shrink-0 flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border bg-card">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all cursor-pointer"
          >
            {t('admin.coupons.cancelBtn', 'Cancel')}
          </button>
          <button
            type="submit"
            form="create-coupon-form"
            disabled={createCouponMutation.isPending}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {createCouponMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('admin.coupons.creating', 'Creating...')}</span>
              </>
            ) : (
              <>
                <Tag className="w-4 h-4" />
                <span>{t('admin.coupons.createBtn', 'Create Coupon')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
