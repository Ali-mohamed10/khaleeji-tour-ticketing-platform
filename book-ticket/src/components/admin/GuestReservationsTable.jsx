import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, Copy, Check, CheckCircle2, CreditCard, Banknote, Trash2 } from 'lucide-react';
import { useCancelBooking } from '../../hooks/useEventBookingsReport';
import { CancelBookingModal } from './CancelBookingModal';

export const GuestReservationsTable = ({ bookings = [], isAr = false }) => {
  const { t } = useTranslation();
  const [copiedCode, setCopiedCode] = useState(null);
  const [selectedBookingToDelete, setSelectedBookingToDelete] = useState(null);

  const cancelBookingMutation = useCancelBooking();

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleConfirmDelete = async (bookingId) => {
    try {
      await cancelBookingMutation.mutateAsync(bookingId);
      setSelectedBookingToDelete(null);
    } catch (err) {
      console.error('Cancel booking error:', err);
    }
  };

  if (!bookings || bookings.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground bg-background/50 rounded-xl border border-border border-dashed">
        {t('admin.bookingsReport.noBookingsYet', 'No guest bookings recorded for this event yet.')}
      </div>
    );
  }

  const renderPaymentBadge = (method) => {
    if (method === 'Stripe') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
          <CreditCard className="w-3 h-3" />
          <span>{t('admin.bookingsReport.methodStripe', 'Stripe')}</span>
        </span>
      );
    }
    if (method === 'Cash') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <Banknote className="w-3 h-3" />
          <span>{t('admin.bookingsReport.methodCash', 'Cash')}</span>
        </span>
      );
    }
    if (method === 'WhatsApp') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30">
          <Phone className="w-3 h-3" />
          <span>{t('admin.bookingsReport.methodWhatsApp', 'WhatsApp')}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
        <span>{method || t('admin.bookingsReport.methodOffline', 'Manual / Offline')}</span>
      </span>
    );
  };

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border bg-background">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border/70 bg-secondary/20 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <th className={`py-2.5 px-3.5 ${isAr ? 'text-right' : 'text-left'}`}>{t('admin.bookingsReport.colGuest', 'Guest Name')}</th>
              <th className={`py-2.5 px-3.5 ${isAr ? 'text-right' : 'text-left'}`}>{t('admin.bookingsReport.colPhone', 'Phone')}</th>
              <th className={`py-2.5 px-3.5 ${isAr ? 'text-right' : 'text-left'}`}>{t('admin.bookingsReport.colSeats', 'Allocated Tables & Seats')}</th>
              <th className={`py-2.5 px-3.5 ${isAr ? 'text-right' : 'text-left'}`}>{t('admin.bookingsReport.colTicketCode', 'Ticket Code')}</th>
              <th className={`py-2.5 px-3.5 ${isAr ? 'text-right' : 'text-left'}`}>{t('admin.bookingsReport.colCheckIn', 'Gate Check-In')}</th>
              <th className={`py-2.5 px-3.5 ${isAr ? 'text-right' : 'text-left'}`}>{t('admin.bookingsReport.colPaymentMethod', 'Payment Method')}</th>
              <th className={`py-2.5 px-3.5 ${isAr ? 'text-right' : 'text-left'}`}>{t('admin.bookingsReport.colAmount', 'Amount Paid')}</th>
              <th className={`py-2.5 px-3.5 ${isAr ? 'text-right' : 'text-left'}`}>{t('admin.bookingsReport.colDate', 'Booking Date')}</th>
              <th className="py-2.5 px-3.5 text-center">{t('admin.bookingsReport.colActions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {bookings.map((b) => {
              const isCopied = copiedCode === b.ticket_code;
              const bookingDate = b.created_at
                ? new Date(b.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—';

              return (
                <tr key={b.id} className="hover:bg-secondary/15 transition-colors">
                  <td className="py-2.5 px-3.5">
                    <div className="font-bold text-foreground truncate max-w-36">{b.customer_name}</div>
                    <div className="text-[10px] text-muted-foreground truncate max-w-36">{b.customer_email || '—'}</div>
                  </td>
                  <td className="py-2.5 px-3.5">
                    {b.customer_phone ? (
                      <a href={`tel:${b.customer_phone}`} className="font-mono text-[11px] text-foreground hover:text-primary transition-colors flex items-center gap-1" dir="ltr">
                        <Phone className="w-3 h-3 text-primary/70 shrink-0" />
                        <span>{b.customer_phone}</span>
                      </a>
                    ) : <span className="text-muted-foreground/60">—</span>}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <div className="flex flex-wrap gap-1">
                      {(b.tables_summary || []).map((tItem, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary/40 border border-border rounded text-[11px] font-semibold text-foreground">
                          <span>{tItem.table_name}</span>
                          <span className="text-primary font-bold">({tItem.seats_count} {t('admin.bookingsReport.seatsCount', 'seats')})</span>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 px-3.5">
                    <div className="inline-flex items-center gap-1.5 bg-secondary/30 border border-border px-2 py-0.5 rounded-lg">
                      <span className="font-mono font-bold text-[11px] text-foreground tracking-wider">{b.ticket_code}</span>
                      <button onClick={() => handleCopy(b.ticket_code)} className="p-0.5 hover:text-primary transition-colors cursor-pointer" title={t('admin.manualBooking.copyCode', 'Copy Code')}>
                        {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                      </button>
                    </div>
                  </td>
                  <td className="py-2.5 px-3.5">
                    {b.is_used ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{t('admin.bookingsReport.checkedIn', 'Checked In')}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <Check className="w-3 h-3" />
                        <span>{t('admin.bookingsReport.validPass', 'Valid Pass')}</span>
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap">{renderPaymentBadge(b.payment_method)}</td>
                  <td className="py-2.5 px-3.5 font-bold font-sans text-foreground whitespace-nowrap">${Number(b.total_amount || 0).toFixed(2)}</td>
                  <td className="py-2.5 px-3.5 text-muted-foreground text-[10px] whitespace-nowrap">{bookingDate}</td>
                  <td className="py-2.5 px-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedBookingToDelete(b)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/15 transition-colors cursor-pointer"
                      title={t('admin.bookingsReport.deleteTooltip', 'Delete booking & release seats')}
                      aria-label={t('admin.bookingsReport.deleteTooltip', 'Delete booking & release seats')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <CancelBookingModal
        isOpen={!!selectedBookingToDelete}
        onClose={() => setSelectedBookingToDelete(null)}
        booking={selectedBookingToDelete}
        onConfirm={handleConfirmDelete}
        isDeleting={cancelBookingMutation.isPending}
        isAr={isAr}
      />
    </>
  );
};

export default GuestReservationsTable;
