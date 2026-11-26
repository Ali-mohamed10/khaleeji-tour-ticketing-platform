/**
 * BookingSummaryCard
 *
 * Purpose: Enhanced booking summary for the public Event Details page.
 *          Displays selected tables, number of selected seats,
 *          pricing breakdown, discount coupon application, service fee, and grand total.
 * Input: eventId, selectedTables (array), currency (string), appliedCoupon, onApplyCoupon, onRemoveCoupon, onSeatsCountChange (func), onTableSelect (func)
 * Output: Rendered booking summary card
 * Dependencies: react-i18next, lucide-react, CouponInputSection
 */
import { useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Tag } from 'lucide-react';
import { CouponInputSection } from './CouponInputSection';

// Tax rate (Ontario HST 13%)
const SERVICE_FEE_RATE = 0.13;

export const BookingSummaryCard = memo(({
  eventId,
  selectedTables = [],
  currency = 'CAD',
  appliedCoupon = null,
  onApplyCoupon,
  onRemoveCoupon,
  onSeatsCountChange,
  onTableSelect,
}) => {
  const { t } = useTranslation();

  // Memoize price calculations including discount
  const pricing = useMemo(() => {
    const totalSeats = selectedTables.reduce((sum, tbl) => sum + (tbl.selectedSeatsCount || 1), 0);
    const ticketTotal = selectedTables.reduce(
      (sum, tbl) => sum + parseFloat(tbl.price || 0) * (tbl.selectedSeatsCount || 1),
      0
    );

    const discountAmount = appliedCoupon?.discountPercent
      ? (ticketTotal * appliedCoupon.discountPercent) / 100
      : 0;

    const netTicketTotal = Math.max(0, ticketTotal - discountAmount);
    const serviceFee = netTicketTotal * SERVICE_FEE_RATE;
    const grandTotal = netTicketTotal + serviceFee;

    return { totalSeats, ticketTotal, discountAmount, netTicketTotal, serviceFee, grandTotal };
  }, [selectedTables, appliedCoupon]);

  return (
    <div
      className="bg-card border border-border rounded-lg shadow-sm overflow-hidden"
      aria-label={t('seatMap.summary', 'Booking Summary')}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-bold text-primary font-sans text-lg uppercase tracking-wider">
          {t('seatMap.summary', 'Booking Summary')}
        </h3>
      </div>

      {/* Selected tables list */}
      <div className="px-5 py-4 min-h-32">
        {selectedTables.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            {t('seatMap.selectTable', 'Click on a table to select it for booking.')}
          </p>
        ) : (
          <div className="space-y-3">
            {selectedTables.map((table) => {
              const currentSeats = table.selectedSeatsCount || 1;
              const tableId = table.id || table.db_id || table.table_code;
              const maxAvailable = table.availableSeats ?? table.capacity;

              return (
                <div
                  key={tableId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-secondary/10 rounded-lg border border-border/50"
                >
                  {/* Table details */}
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-secondary/20 border border-border shrink-0">
                      <span className="text-xl font-bold font-serif text-foreground leading-none">
                        {table.table_code || table.id}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full text-primary-foreground"
                          style={{ backgroundColor: `var(--seat-${table.category})` }}
                        >
                          {t(`seatMap.${table.category}`, table.category)}
                        </span>
                      </div>

                      {/* Seats counter adjustment */}
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center bg-background border border-border rounded-lg p-0.5 shadow-sm">
                          <button
                            type="button"
                            onClick={() => onSeatsCountChange?.(tableId, Math.max(1, currentSeats - 1))}
                            disabled={currentSeats <= 1}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-secondary/40 text-foreground disabled:opacity-20 transition-colors font-bold text-xs cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-foreground">
                            {currentSeats}
                          </span>
                          <button
                            type="button"
                            onClick={() => onSeatsCountChange?.(tableId, Math.min(maxAvailable, currentSeats + 1))}
                            disabled={currentSeats >= maxAvailable}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-secondary/40 text-foreground disabled:opacity-20 transition-colors font-bold text-xs cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {t('seatMap.seatsLabel', 'seats')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price display & Remove button */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-border/50 pt-3 sm:pt-0">
                    <div className="text-right">
                      <span className="font-bold text-foreground block">
                        ${(Number(table.price) * currentSeats).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        ${Number(table.price).toFixed(2)} x {currentSeats}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onTableSelect?.(table)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                      title={t('seatMap.deselectTable', 'Remove Table')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pricing breakdown & Coupon Input — only show when tables are selected */}
      {selectedTables.length > 0 && (
        <div className="px-5 py-4 border-t border-border space-y-3.5">
          {/* Promo Code Input Box */}
          <CouponInputSection
            eventId={eventId}
            appliedCoupon={appliedCoupon}
            onApplyCoupon={onApplyCoupon}
            onRemoveCoupon={onRemoveCoupon}
          />

          {/* Total seats count */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t('checkout.totalSeats', 'Total Seats Booked')}
            </span>
            <span className="text-foreground font-medium">{pricing.totalSeats}</span>
          </div>

          {/* Ticket total */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t('checkout.ticketPrice', 'Ticket Price')}
            </span>
            <span className="text-foreground font-medium">${pricing.ticketTotal.toFixed(2)}</span>
          </div>

          {/* Discount amount if applied */}
          {pricing.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-emerald-500 font-semibold animate-fade-in">
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                {t('checkout.coupon.discountLabel', { code: appliedCoupon?.code })}
              </span>
              <span>
                -${pricing.discountAmount.toFixed(2)} (-{appliedCoupon?.discountPercent}%)
              </span>
            </div>
          )}

          {/* Tax: HST 13% */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t('checkout.serviceFee', 'Tax: HST 13%')}
            </span>
            <span className="text-foreground font-medium">${pricing.serviceFee.toFixed(2)}</span>
          </div>

          {/* Grand total */}
          <div className="flex justify-between text-base font-bold pt-2 border-t border-border/50">
            <span className="text-foreground">{t('checkout.grandTotal', 'Grand Total')}</span>
            <span className="text-primary font-serif text-xl">
              ${pricing.grandTotal.toFixed(2)} {currency}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

BookingSummaryCard.displayName = 'BookingSummaryCard';
export default BookingSummaryCard;
