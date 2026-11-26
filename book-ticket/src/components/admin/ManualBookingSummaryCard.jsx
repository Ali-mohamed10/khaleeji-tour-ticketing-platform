import { useTranslation } from 'react-i18next';
import { Calendar, Armchair, DollarSign, Mail, Loader2, Send, CreditCard } from 'lucide-react';

export const ManualBookingSummaryCard = ({
  event,
  table,
  seatsCount,
  subtotal = 0,
  taxAmount = 0,
  totalAmount = 0,
  currency = 'CAD',
  customerEmail,
  paymentMethod = 'Cash',
  isSubmitting,
  onSubmit,
  disabled,
  error,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const eventTitle = isAr ? event?.title_ar || event?.title_en : event?.title_en || event?.title_ar;
  const tableLabel = table?.table_code || table?.svg_element_id || '—';

  return (
    <div className="bg-secondary/15 border border-border rounded-2xl p-5 space-y-4 flex flex-col justify-between">
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          <span>{t('admin.manualBooking.summaryTitle', 'Reservation Summary')}</span>
        </h3>

        {/* Details Grid */}
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-border/50">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary/70" />
              {t('admin.manualBooking.summaryEvent', 'Event')}:
            </span>
            <span className="font-semibold text-foreground truncate max-w-48 text-right">
              {eventTitle || '—'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-border/50">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Armchair className="w-3.5 h-3.5 text-primary/70" />
              {t('admin.manualBooking.summaryTable', 'Table')}:
            </span>
            <span className="font-semibold text-foreground">
              {tableLabel !== '—' ? `#${String(tableLabel).replace(/^#+/, '')}` : '—'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-border/50">
            <span className="text-muted-foreground">
              {t('admin.manualBooking.summarySeats', 'Seats')}:
            </span>
            <span className="font-bold text-foreground font-mono">
              {seatsCount || 1}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-border/50">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-primary/70" />
              {t('admin.manualBooking.paymentMethod', 'Payment Channel')}:
            </span>
            <span className="font-semibold text-foreground">
              {paymentMethod || 'Cash'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-border/50">
            <span className="text-muted-foreground">
              {t('admin.manualBooking.summarySubtotal', 'Subtotal')}:
            </span>
            <span className="font-semibold text-foreground font-mono">
              ${Number(subtotal || 0).toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-border/50">
            <span className="text-muted-foreground">
              {t('admin.manualBooking.taxHst', 'Tax: HST 13%')}:
            </span>
            <span className="font-semibold text-foreground font-mono">
              ${Number(taxAmount || 0).toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 bg-primary/10 rounded-xl px-3 border border-primary/20">
            <span className="font-bold text-xs text-foreground">
              {t('admin.manualBooking.summaryTotal', 'Total Amount')}:
            </span>
            <span className="font-bold text-base text-primary font-mono">
              ${Number(totalAmount || 0).toFixed(2)} {currency}
            </span>
          </div>
        </div>

        {/* Email Notice */}
        <div className="p-3 bg-secondary/30 rounded-xl border border-border/60 text-[11px] text-muted-foreground flex items-start gap-2">
          <Mail className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {t(
              'admin.manualBooking.summaryEmailNotice',
              'Upon issuing, the customer will instantly receive the official ticket confirmation email with QR code.'
            )}
            {customerEmail && (
              <span className="block font-semibold text-foreground mt-0.5 truncate">
                {customerEmail}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 rounded-xl bg-destructive/15 text-destructive border border-destructive/30 text-xs">
          {error}
        </div>
      )}

      {/* Action Button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || isSubmitting}
        className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
          disabled || isSubmitting
            ? 'bg-muted text-muted-foreground opacity-60 cursor-not-allowed'
            : 'bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-md'
        }`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t('admin.manualBooking.submitting', 'Issuing Ticket & Sending Email...')}</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>{t('admin.manualBooking.submitButton', 'Issue Ticket & Send Confirmation Email')}</span>
          </>
        )}
      </button>
    </div>
  );
};
