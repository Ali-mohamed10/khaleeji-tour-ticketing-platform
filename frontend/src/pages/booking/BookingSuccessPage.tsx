import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toPng } from 'html-to-image';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  Printer,
  Calendar,
  MapPin,
  User,
  Ticket as TicketIcon,
  Sparkles,
} from 'lucide-react';
import { useBookingStatus } from '../../hooks/useBooking';
import { clearStoredSeats } from '../../utils/seatStorage';
import { clearStoredCoupon } from '../../utils/couponStorage';

export const BookingSuccessPage = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id') || undefined;
  const bookingId = searchParams.get('booking_id') || undefined;

  const ticketCardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: booking, isLoading, isError, error } = useBookingStatus({
    sessionId,
    id: bookingId,
  });

  const status = booking?.status;
  const ticket = booking?.tickets?.[0];

  // Clear stored seat selection and applied coupon from localStorage upon successful booking & payment
  useEffect(() => {
    if (booking?.status === 'PAID' || status === 'PAID') {
      clearStoredSeats(booking?.event_id);
      clearStoredCoupon(booking?.event_id);
    }
  }, [booking?.status, booking?.event_id, status]);

  // Direct High-Resolution PNG Image Download
  const handleDownloadImage = useCallback(async () => {
    if (!ticketCardRef.current) return;
    setIsDownloading(true);

    try {
      // Small pause to ensure images/fonts are fully ready
      await document.fonts.ready;
      
      const dataUrl = await toPng(ticketCardRef.current, {
        cacheBust: true,
        pixelRatio: 2.5, // Crisp 2.5x retina quality
        backgroundColor: '#1b120f',
        style: {
          margin: '0',
          borderRadius: '16px',
        },
      });

      const ticketCode = ticket?.ticket_code || booking?.id?.slice(0, 8) || 'KT-TICKET';
      const link = document.createElement('a');
      link.download = `Khaleeji-Tour-Ticket-${ticketCode}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating ticket image, falling back to print:', err);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  }, [ticket?.ticket_code, booking?.id]);

  // Clean Print Handler (Only prints the ticket card via CSS @media print)
  const handlePrintTicket = () => {
    window.print();
  };

  if (isLoading || (booking && status === 'PENDING')) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center container mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse border border-primary/20">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold font-sans text-foreground mb-3 uppercase tracking-wider">
          {t('booking.verifyingTitle', 'Payment is being verified...')}
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mb-6 leading-relaxed">
          {t('booking.verifyingDesc', 'Please wait a moment while Stripe confirms your payment. Do not close or refresh this window.')}
        </p>
        <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
          <span>{t('booking.pollingBadge', 'Polling payment status every 2 seconds')}</span>
        </div>
      </div>
    );
  }

  if (isError || status === 'FAILED' || status === 'EXPIRED') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center container mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6 border border-destructive/30">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold font-sans text-foreground mb-3 uppercase tracking-wider">
          {status === 'EXPIRED'
            ? t('booking.expiredTitle', 'Reservation Expired')
            : t('booking.failedTitle', 'Payment Unverified or Failed')}
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mb-8 leading-relaxed">
          {status === 'EXPIRED'
            ? t('booking.expiredDesc', 'Your 15-minute reservation window timed out before payment was completed.')
            : (error?.message || t('booking.failedDesc', 'We could not confirm payment for this reservation.'))}
        </p>
        <Link
          to="/"
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          {t('booking.returnHome', 'Return to Home')}
        </Link>
      </div>
    );
  }

  if (!booking || status !== 'PAID') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl animate-fade-in-up">
      {/* Header Banner (Hidden on Print) */}
      <div className="text-center mb-8 print:hidden print-hide">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-md">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl md:text-4xl font-bold font-sans text-foreground uppercase tracking-wider mb-2">
          {t('booking.confirmedTitle', 'Booking Confirmed!')}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t('booking.confirmedDesc', 'Your payment was successfully verified by Stripe Webhook. Here is your official ticket.')}
        </p>
      </div>

      {/* Ticket Card Component (Clean Single-Card Print & Download Target) */}
      <div
        ref={ticketCardRef}
        id="printable-ticket"
        className="ticket-print-wrapper bg-card border-2 border-primary/50 rounded-2xl overflow-hidden shadow-2xl mb-8 relative bg-radial from-card to-background text-foreground"
      >
        {/* Ticket Top Header with Brand Accent */}
        <div className="bg-primary/15 border-b border-primary/25 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20 text-primary">
              <TicketIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold tracking-widest text-primary block flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                {t('booking.officialTicket', 'Official Event Ticket')}
              </span>
              <span className="font-mono text-xs font-bold text-foreground">
                #{ticket?.ticket_code || booking.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
          </div>
          <span className="px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-500 text-xs font-bold uppercase tracking-wider shadow-xs">
            {t('booking.statusPaid', 'PAID')}
          </span>
        </div>

        {/* Ticket Content Grid */}
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-[1fr_220px] gap-8 items-center">
          {/* Details Column */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground font-sans tracking-wide">
                {isAr
                  ? booking.events?.title_ar || booking.events?.title_en
                  : booking.events?.title_en || t('booking.eventTicket', 'Khaleeji Tour Event')}
              </h3>
              {(booking.events?.venue_en || booking.events?.venue_ar) && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5 font-medium">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    {isAr ? booking.events.venue_ar || booking.events.venue_en : booking.events.venue_en}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/60">
              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">
                    {t('booking.guestName', 'Guest Name')}
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {booking.customer_name}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">
                    {t('booking.bookingDate', 'Booked On')}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {new Date(booking.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Tables list */}
            <div className="pt-3 border-t border-border/60">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1.5 tracking-wider">
                {t('booking.reservedTables', 'Reserved Tables')}
              </span>
              <div className="flex flex-wrap gap-2">
                {booking.booking_items?.map((item) => (
                  <span
                    key={item.id}
                    className="px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-lg text-xs font-bold text-foreground flex items-center gap-1.5"
                  >
                    <span className="text-primary">
                      Table #{String(item.tables?.table_code || 'T-ID').replace(/^#+/, '')}
                    </span>
                    <span className="text-muted-foreground font-normal">
                      ({item.seats_count} {t('booking.seats', 'seats')})
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {/* Total Paid */}
            <div className="pt-3 border-t border-border/60 flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-muted-foreground block">
                  {t('booking.totalPaid', 'Total Amount Paid')}
                </span>
                {Number(booking.discount_amount) > 0 && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                    <Sparkles className="w-3 h-3" />
                    <span>-${Number(booking.discount_amount).toFixed(2)} {booking.currency} {t('checkout.coupon.discountApplied', 'Discount Applied')}</span>
                  </span>
                )}
              </div>
              <div className="text-right">
                {Number(booking.discount_amount) > 0 && Number(booking.original_amount) > 0 && (
                  <span className="text-xs text-muted-foreground line-through block">
                    ${Number(booking.original_amount).toFixed(2)} {booking.currency}
                  </span>
                )}
                <span className="text-xl font-bold font-serif text-primary">
                  ${Number(booking.total_amount).toFixed(2)} {booking.currency}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code Column */}
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-border text-center shadow-lg">
            {ticket?.qr_code_url ? (
              <img
                src={ticket.qr_code_url}
                alt="Ticket QR Code"
                className="w-40 h-40 object-contain rounded"
              />
            ) : (
              <div className="w-40 h-40 bg-gray-100 flex items-center justify-center text-xs text-gray-500 rounded font-mono">
                QR CODE
              </div>
            )}
            <span className="text-[11px] font-mono text-neutral-900 font-bold mt-2.5 uppercase tracking-widest">
              {ticket?.ticket_code || 'KT-TICKET'}
            </span>
            <span className="text-[9px] text-neutral-500 mt-0.5 font-medium">
              {t('booking.scanAtEntrance', 'Scan at venue entrance')}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons (Hidden on Print) */}
      <div className="flex flex-wrap items-center justify-center gap-3.5 print:hidden print-hide">
        {/* Download High Res Image Button */}
        <button
          onClick={handleDownloadImage}
          disabled={isDownloading}
          className="bg-primary text-primary-foreground px-6 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2 cursor-pointer shadow-lg"
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>{t('booking.downloadImage', 'Download Ticket Image')}</span>
        </button>

        {/* Print / Save PDF Button */}
        <button
          onClick={handlePrintTicket}
          className="bg-card hover:bg-muted/30 border border-border text-foreground px-6 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Printer className="w-4 h-4 text-primary" />
          <span>{t('booking.printTicket', 'Print / PDF')}</span>
        </button>

        {/* Browse More Events */}
        <Link
          to="/"
          className="bg-secondary/15 hover:bg-secondary/25 border border-border text-foreground px-6 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-colors"
        >
          {t('booking.browseMoreEvents', 'Browse More Events')}
        </Link>
      </div>
    </div>
  );
};

export default BookingSuccessPage;
