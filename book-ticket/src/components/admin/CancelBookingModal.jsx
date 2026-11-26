import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Trash2, X, Loader2, Armchair } from 'lucide-react';

export const CancelBookingModal = ({
  isOpen,
  onClose,
  booking,
  onConfirm,
  isDeleting = false,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeleting) onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !booking || typeof document === 'undefined') return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-card border border-destructive/30 rounded-2xl p-6 shadow-2xl space-y-5 animate-scale-in my-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 end-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors cursor-pointer disabled:opacity-50"
          aria-label={t('common.close', 'Close')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon & Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-destructive/15 text-destructive border border-destructive/30 flex items-center justify-center">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold font-sans text-foreground">
            {t('admin.bookingsReport.deleteModalTitle', 'Delete Booking & Release Seats?')}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t(
              'admin.bookingsReport.deleteModalSubtitle',
              'This action will cancel the ticket and instantly return the allocated seats back to available status.'
            )}
          </p>
        </div>

        {/* Booking Details Box */}
        <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-2.5 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-border/40">
            <span className="text-muted-foreground">{t('admin.bookingsReport.colGuest', 'Guest Name')}:</span>
            <span className="font-bold text-foreground truncate max-w-48">{booking.customer_name}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-border/40">
            <span className="text-muted-foreground">{t('admin.bookingsReport.colTicketCode', 'Ticket Code')}:</span>
            <span className="font-mono font-bold text-primary">{booking.ticket_code}</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <Armchair className="w-3.5 h-3.5 text-primary" />
              <span>{t('admin.bookingsReport.colSeats', 'Allocated Seats')}:</span>
            </span>
            <span className="font-bold text-emerald-500 font-mono">
              +{booking.total_seats || 1} {t('admin.bookingsReport.seatsCount', 'seats')} {t('admin.bookingsReport.willBeFreed', 'will be restored')}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-all border border-border cursor-pointer disabled:opacity-50"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(booking.id)}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('admin.bookingsReport.deleting', 'Releasing...')}</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{t('admin.bookingsReport.confirmDeleteBtn', 'Delete & Free Seats')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CancelBookingModal;
