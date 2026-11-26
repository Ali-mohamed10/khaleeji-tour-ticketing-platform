import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  MapPin,
  Ticket,
  ChevronDown,
  ChevronUp,
  Armchair,
  Search,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEventBookingsReport } from '../../hooks/useEventBookingsReport';
import AppImage from '../common/AppImage';
import { GuestReservationsTable } from './GuestReservationsTable';

export const EventBookingsSection = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { data: report, isLoading, isError, refetch } = useEventBookingsReport();

  const [expandedEventId, setExpandedEventId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleExpand = (eventId) => {
    setExpandedEventId((prev) => (prev === eventId ? null : eventId));
  };

  // Filter events based on search term
  const filteredEvents = (report || []).filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    const titleEn = (item.title_en || '').toLowerCase();
    const titleAr = (item.title_ar || '').toLowerCase();
    const venueEn = (item.venue_en || '').toLowerCase();
    const venueAr = (item.venue_ar || '').toLowerCase();
    return titleEn.includes(q) || titleAr.includes(q) || venueEn.includes(q) || venueAr.includes(q);
  });

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs space-y-0">
      {/* Section Header */}
      <div className="p-5 border-b border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
              <Armchair className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-sans text-foreground">
                {t('admin.bookingsReport.title', 'Event Capacity & Bookings')}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t('admin.bookingsReport.subtitle', 'Track seat occupancy, total capacities, and attendee reservations per event.')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-lg border border-border">
              {t('admin.bookingsReport.totalEvents', 'Active Events: {{count}}', { count: report?.length || 0 })}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className={`w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3.5' : 'left-3.5'}`} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('admin.bookingsReport.searchPlaceholder', 'Filter events by title or venue...')}
            className={`w-full bg-background border border-border rounded-xl py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${
              isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'
            }`}
          />
        </div>
      </div>

      {/* Events Occupancy List / Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">{t('common.loading', 'Loading events data...')}</span>
          </div>
        ) : isError ? (
          <div className="py-12 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
            <p className="text-sm text-destructive">{t('admin.bookingsReport.errorLoading', 'Failed to load bookings report.')}</p>
            <button
              onClick={() => refetch()}
              className="text-xs bg-secondary px-3 py-1.5 rounded-lg text-foreground hover:bg-secondary/80 transition-colors"
            >
              {t('common.tryAgain', 'Try Again')}
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            {t('admin.bookingsReport.noEvents', 'No events found.')}
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filteredEvents.map((evt) => {
              const isExpanded = expandedEventId === evt.event_id;
              const eventTitle = isAr ? evt.title_ar || evt.title_en : evt.title_en || evt.title_ar;
              const venueTitle = isAr ? evt.venue_ar || evt.venue_en : evt.venue_en || evt.venue_ar;

              const formattedDate = evt.start_date
                ? new Date(evt.start_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    timeZone: 'UTC',
                  })
                : 'TBD';

              return (
                <div key={evt.event_id} className="transition-colors hover:bg-secondary/5">
                  {/* Event Overview Row */}
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Event Info */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/70">
                        {evt.cover_image_url ? (
                          <AppImage
                            src={evt.cover_image_url}
                            alt={eventTitle}
                            className="w-full h-full object-cover"
                            containerClassName="w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground">
                            <Calendar className="w-5 h-5 opacity-40" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <Link
                          to={`/events/${evt.slug}`}
                          className="font-bold text-base text-foreground hover:text-primary transition-colors truncate block flex items-center gap-1 group"
                        >
                          <span className="truncate">{eventTitle}</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0" />
                        </Link>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                            {formattedDate}
                          </span>
                          <span className="flex items-center gap-1 truncate max-w-64">
                            <MapPin className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                            <span className="truncate">{venueTitle}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Numeric Seat Capacity Stats (أرقام فقط) */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4 shrink-0 bg-secondary/15 p-2.5 sm:p-3 rounded-xl border border-border text-center items-center">
                      {/* 1. Total Capacity */}
                      <div className="px-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                          {t('admin.bookingsReport.capacity', 'Capacity')}
                        </span>
                        <span className="text-base sm:text-lg font-bold font-sans text-foreground">
                          {evt.total_capacity}
                        </span>
                      </div>

                      {/* 2. Booked Seats */}
                      <div className="px-2 border-x border-border/60">
                        <span className="text-[10px] uppercase font-bold text-amber-500 block">
                          {t('admin.bookingsReport.booked', 'Booked')}
                        </span>
                        <span className="text-base sm:text-lg font-bold font-sans text-amber-500">
                          {evt.booked_seats}
                        </span>
                      </div>

                      {/* 3. Remaining Seats */}
                      <div className="px-2">
                        <span className="text-[10px] uppercase font-bold text-emerald-500 block">
                          {t('admin.bookingsReport.remaining', 'Remaining')}
                        </span>
                        <span className="text-base sm:text-lg font-bold font-sans text-emerald-500">
                          {evt.remaining_seats}
                        </span>
                      </div>

                      {/* 4. Total Revenue */}
                      <div className="hidden sm:block px-2 border-l border-border/60">
                        <span className="text-[10px] uppercase font-bold text-primary block">
                          {t('admin.bookingsReport.revenue', 'Revenue')}
                        </span>
                        <span className="text-sm font-bold font-sans text-primary">
                          ${Number(evt.total_revenue).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Expand/Collapse Bookings Button */}
                    <div className="shrink-0 flex items-center justify-end">
                      <button
                        onClick={() => toggleExpand(evt.event_id)}
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isExpanded
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                            : 'bg-secondary hover:bg-secondary/80 text-foreground border-border'
                        }`}
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>{t('admin.bookingsReport.viewBookings', 'Bookings')}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          isExpanded ? 'bg-black/20 text-white' : 'bg-primary/20 text-primary'
                        }`}>
                          {evt.bookings_count}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Sub-Table of Bookings */}
                  {isExpanded && (
                    <div className="bg-secondary/10 border-t border-border p-4 sm:p-5 space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                          <Ticket className="w-4 h-4 text-primary" />
                          <span>{t('admin.bookingsReport.guestReservations', 'Guest Reservations ({{count}})', { count: evt.bookings.length })}</span>
                        </h4>
                      </div>

                      <GuestReservationsTable bookings={evt.bookings} isAr={isAr} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventBookingsSection;
