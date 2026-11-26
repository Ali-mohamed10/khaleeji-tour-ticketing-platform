import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Copy, Check, ExternalLink, Mail, X } from 'lucide-react';

export const ManualBookingSuccessModal = ({ isOpen, onClose, bookingData }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !bookingData || typeof document === 'undefined') return null;

  const ticketCode = bookingData.ticketCode || bookingData.ticket?.ticket_code || 'KT-TICKET';
  const bookingId = bookingData.bookingId || bookingData.ticket?.booking_id;
  const emailDelivered = bookingData.emailDelivered;

  const handleCopy = () => {
    navigator.clipboard.writeText(ticketCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-6 animate-scale-in max-h-[calc(100vh-2rem)] overflow-y-auto my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors cursor-pointer"
          aria-label={t('admin.manualBooking.close', 'Close')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon & Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold font-sans text-foreground">
            {t('admin.manualBooking.successTitle', 'Booking Confirmed & Ticket Issued!')}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t('admin.manualBooking.successSubtitle', 'The manual booking has been saved, table seats updated, and ticket issued.')}
          </p>
        </div>

        {/* Ticket Code Box */}
        <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-2 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {t('admin.manualBooking.ticketCode', 'Ticket Code')}
          </span>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-xl font-bold tracking-widest text-primary">
              {ticketCode}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-background border border-border text-foreground hover:text-primary transition-colors cursor-pointer"
              title={t('admin.manualBooking.copyCode', 'Copy Code')}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Email Status Badge */}
        <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <Mail className="w-4 h-4 shrink-0" />
          <span>
            {emailDelivered
              ? t('admin.manualBooking.emailSentBadge', 'Confirmation Email Delivered')
              : t('admin.manualBooking.emailWarningBadge', 'Ticket created; email dispatch pending')}
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          {bookingId && (
            <a
              href={`/booking/success?booking_id=${bookingId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-all border border-border"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{t('admin.manualBooking.viewTicket', 'View Ticket Online')}</span>
            </a>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            {t('admin.manualBooking.newBookingBtn', 'Create Another Booking')}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

