import React, { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  MapPin,
  QrCode,
  Download,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { UserTicket } from '../../hooks/useUserTickets';

interface TicketCardProps {
  ticket: UserTicket;
  onOpenPass: (ticket: UserTicket) => void;
}

export const TicketCard: React.FC<TicketCardProps> = memo(({ ticket, onOpenPass }) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [copied, setCopied] = useState(false);

  const eventTitle = isAr ? ticket.event.title_ar || ticket.event.title_en : ticket.event.title_en;
  const venueTitle = isAr ? ticket.event.venue_ar || ticket.event.venue_en : ticket.event.venue_en;
  const cityTitle = isAr ? ticket.event.city_ar || ticket.event.city_en : ticket.event.city_en;

  const startDate = new Date(ticket.event.start_date);
  const formattedDate = startDate.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const formattedTime = startDate.toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  });

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ticket.ticket_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ticket.qr_code_url) return;
    const link = document.createElement('a');
    link.href = ticket.qr_code_url;
    link.download = `Ticket-${ticket.ticket_code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Card Header Banner */}
        <div className="relative h-40 bg-muted overflow-hidden">
          {ticket.event.cover_image_url ? (
            <img
              src={ticket.event.cover_image_url}
              alt={`${eventTitle} - Khaleeji Tour Ticket`}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-background to-secondary/30 flex items-center justify-center">
              <span className="text-2xl font-bold font-sans text-primary">Khaleeji Tour</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Status Badge */}
          <div className={`absolute top-3 ${isAr ? 'left-3' : 'right-3'}`}>
            {ticket.is_used ? (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/90 text-white backdrop-blur-sm shadow-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {t('myTickets.statusUsed', 'Checked In')}
              </span>
            ) : ticket.isUpcoming ? (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/90 text-white backdrop-blur-sm shadow-xs flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {t('myTickets.statusValid', 'Valid Pass')}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted-foreground/80 text-white backdrop-blur-sm shadow-xs">
                {t('myTickets.statusPast', 'Past Event')}
              </span>
            )}
          </div>

          {/* Date Badge on Image */}
          <div className={`absolute bottom-3 ${isAr ? 'right-3' : 'left-3'} text-white`}>
            <span className="text-xs font-bold block drop-shadow-md">{formattedDate}</span>
            <span className="text-[11px] opacity-90 block drop-shadow-md">{formattedTime}</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-4">
          {/* Event Title */}
          <div>
            <h3 className="font-bold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {eventTitle}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">
                {venueTitle}
                {cityTitle ? `, ${cityTitle}` : ''}
              </span>
            </div>
          </div>

          {/* Ticket Info Box */}
          <div className="bg-secondary/15 rounded-xl p-3.5 border border-border/70 space-y-2.5 text-xs">
            {/* Ticket Code */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                {t('myTickets.ticketCode', 'Ticket Code')}
              </span>
              <div className="flex items-center gap-1.5 bg-background border border-border/80 px-2.5 py-1 rounded-lg">
                <span className="font-mono font-bold text-xs text-foreground tracking-wider">
                  {ticket.ticket_code}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="hover:text-primary transition-colors cursor-pointer"
                  title="Copy"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Tables & Seats */}
            <div className="flex items-center justify-between border-t border-border/40 pt-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                {t('myTickets.seats', 'Seats / Tables')}
              </span>
              <span className="font-bold text-foreground">
                {ticket.tables?.map((t) => `${t.table_name} (${t.seats_count})`).join(', ') ||
                  `${ticket.totalSeats} seats`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-5 pt-0 flex gap-2">
        <button
          onClick={() => onOpenPass(ticket)}
          className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <QrCode className="w-4 h-4" />
          <span>{t('myTickets.viewQr', 'View Pass')}</span>
        </button>

        {ticket.qr_code_url && (
          <button
            onClick={handleDownload}
            className="p-2.5 rounded-xl bg-secondary/30 hover:bg-secondary/60 text-foreground border border-border transition-colors cursor-pointer"
            title={t('myTickets.downloadQr', 'Download QR')}
            aria-label="Download QR"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {ticket.event.slug && (
          <Link
            to={`/events/${ticket.event.slug}`}
            className="p-2.5 rounded-xl bg-secondary/30 hover:bg-secondary/60 text-foreground border border-border transition-colors flex items-center justify-center"
            title={t('myTickets.viewEvent', 'Event Details')}
            aria-label="Event Details"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
});

TicketCard.displayName = 'TicketCard';
