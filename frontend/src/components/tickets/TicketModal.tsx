import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  X,
  Calendar,
  MapPin,
  Clock,
  User,
  Ticket as TicketIcon,
  Download,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { UserTicket } from '../../hooks/useUserTickets';

interface TicketModalProps {
  ticket: UserTicket | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * TicketModal
 *
 * Renders as a React Portal on document.body to guarantee it sits above
 * everything. Locks <body> scroll while open and covers the full viewport.
 */
export const TicketModal: React.FC<TicketModalProps> = ({ ticket, isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [copied, setCopied] = useState(false);
  const passRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while modal is visible
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleCopyCode = useCallback(() => {
    if (!ticket) return;
    navigator.clipboard.writeText(ticket.ticket_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [ticket]);

  const handleDownload = useCallback(() => {
    if (!ticket?.qr_code_url) return;
    const link = document.createElement('a');
    link.href = ticket.qr_code_url;
    link.download = `Ticket-${ticket.ticket_code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [ticket]);

  if (!isOpen || !ticket) return null;

  const eventTitle = isAr ? ticket.event.title_ar || ticket.event.title_en : ticket.event.title_en;
  const venueTitle = isAr ? ticket.event.venue_ar || ticket.event.venue_en : ticket.event.venue_en;
  const cityTitle = isAr ? ticket.event.city_ar || ticket.event.city_en : ticket.event.city_en;

  const startDate = new Date(ticket.event.start_date);
  const formattedDate = startDate.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const formattedTime = startDate.toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  });

  const modalContent = (
    /* ── Full-screen overlay ── */
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        padding: '16px',
        backgroundColor: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        overflow: 'hidden',
      }}
      onClick={onClose}
    >
      {/* ── Modal card ── */}
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl flex flex-col w-full max-w-[420px]"
        style={{ maxHeight: 'calc(100vh - 48px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="relative shrink-0 rounded-t-2xl bg-secondary/25 border-b border-border/60 px-5 py-4 text-center">
          {/* Close btn */}
          <button
            onClick={onClose}
            className={`absolute top-3 ${isAr ? 'left-3' : 'right-3'} w-7 h-7 rounded-full bg-card/80 hover:bg-muted text-foreground flex items-center justify-center transition-colors cursor-pointer border border-border/50`}
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <span className="inline-block px-2.5 py-0.5 bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-widest rounded-full">
            Khaleeji Tour Pass
          </span>
          <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug mt-1">
            {eventTitle}
          </h2>
          <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground mt-0.5">
            <MapPin className="w-3 h-3 text-primary shrink-0" />
            <span className="truncate">
              {venueTitle}
              {cityTitle ? `, ${cityTitle}` : ''}
            </span>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div
          ref={passRef}
          className="overflow-y-auto flex-1 p-4 space-y-3"
          style={{ overscrollBehavior: 'contain' }}
        >
          {/* QR Section */}
          <div className="flex flex-col items-center p-4 bg-background rounded-xl border border-dashed border-border text-center">
            {/* Status badge */}
            {ticket.is_used ? (
              <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-[11px] font-bold uppercase tracking-wider">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{t('myTickets.ticketUsed', 'Checked In')}</span>
                {ticket.used_at && (
                  <span className="text-[10px] opacity-80 font-mono font-normal">
                    •{' '}
                    {new Date(ticket.used_at).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            ) : (
              <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-[11px] font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('myTickets.statusValid', 'Valid Pass')}</span>
              </div>
            )}

            {/* QR image */}
            {ticket.qr_code_url ? (
              <img
                src={ticket.qr_code_url}
                alt="Ticket QR Code"
                className="w-40 h-40 rounded-lg object-contain bg-white p-1.5 shadow-sm"
              />
            ) : (
              <div className="w-40 h-40 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground">
                <TicketIcon className="w-10 h-10 opacity-30" />
              </div>
            )}

            {/* Ticket code */}
            <div className="mt-3 flex items-center gap-2 bg-secondary/30 border border-border px-3 py-1 rounded-full">
              <span className="font-mono font-bold text-xs text-foreground tracking-wider">
                {ticket.ticket_code}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-0.5 hover:text-primary transition-colors cursor-pointer"
                title="Copy code"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <span className="text-[10px] text-muted-foreground mt-1.5">
              {t('myTickets.scanInstruction', 'Present this QR code at the gate for entry')}
            </span>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-2.5 bg-secondary/15 rounded-xl p-3 border border-border text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3 text-primary" />
                {t('myTickets.guestName', 'Guest Name')}
              </span>
              <span className="font-bold text-foreground block truncate">
                {ticket.customer_name}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <TicketIcon className="w-3 h-3 text-primary" />
                {t('myTickets.seatsBooked', 'Seats Booked')}
              </span>
              <span className="font-bold text-primary block">
                {ticket.totalSeats} {t('myTickets.seatsCount', 'seats')}
              </span>
            </div>

            <div className="space-y-0.5 pt-2 border-t border-border/50">
              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3 text-primary" />
                {t('myTickets.eventDate', 'Date')}
              </span>
              <span className="font-medium text-foreground block">{formattedDate}</span>
            </div>

            <div className="space-y-0.5 pt-2 border-t border-border/50">
              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary" />
                {t('myTickets.eventTime', 'Time')}
              </span>
              <span className="font-medium text-foreground block">{formattedTime}</span>
            </div>

            {/* Tables */}
            {ticket.tables && ticket.tables.length > 0 && (
              <div className="col-span-2 pt-2 border-t border-border/50">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                  {t('myTickets.allocatedTables', 'Allocated Tables')}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ticket.tables.map((tbl, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-card border border-border rounded-md text-[11px] font-semibold text-foreground"
                    >
                      {tbl.table_name} ({tbl.seats_count} {t('myTickets.seatsCount', 'seats')})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer actions ── */}
        <div className="shrink-0 p-3 border-t border-border bg-card rounded-b-2xl flex gap-2">
          {ticket.qr_code_url && (
            <button
              onClick={handleDownload}
              className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{t('myTickets.downloadQr', 'Download QR Pass')}</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer border border-border"
          >
            {t('common.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );

  // Render via portal to escape any parent overflow/z-index constraints
  return createPortal(modalContent, document.body);
};
