import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Ticket as TicketIcon, Search, Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { useUserTickets, UserTicket } from '../../hooks/useUserTickets';
import { TicketCard } from '../../components/tickets/TicketCard';
import { TicketModal } from '../../components/tickets/TicketModal';
import { SEO } from '../../components/common/SEO';

export const MyTicketsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { data: tickets, isLoading, isError, refetch } = useUserTickets();
  const [selectedTicket, setSelectedTicket] = useState<UserTicket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Tab filter state: 'all' | 'upcoming' | 'past'
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle open modal
  const handleOpenPass = (ticket: UserTicket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    const list = tickets || [];
    return list.filter((ticket) => {
      // Tab filter
      if (activeFilter === 'upcoming' && (!ticket.isUpcoming || ticket.is_used)) {
        return false;
      }
      if (activeFilter === 'past' && ticket.isUpcoming && !ticket.is_used) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleEn = ticket.event.title_en?.toLowerCase() || '';
        const titleAr = ticket.event.title_ar?.toLowerCase() || '';
        const code = ticket.ticket_code.toLowerCase();
        const venue = (ticket.event.venue_en || '').toLowerCase();
        const guest = (ticket.customer_name || '').toLowerCase();

        return (
          titleEn.includes(q) ||
          titleAr.includes(q) ||
          code.includes(q) ||
          venue.includes(q) ||
          guest.includes(q)
        );
      }

      return true;
    });
  }, [tickets, activeFilter, searchQuery]);

  const upcomingCount = useMemo(() => {
    return (tickets || []).filter((t) => t.isUpcoming && !t.is_used).length;
  }, [tickets]);

  const pastCount = useMemo(() => {
    return (tickets || []).filter((t) => !t.isUpcoming || t.is_used).length;
  }, [tickets]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8 animate-fade-in">
      <SEO
        title={isAr ? 'تذاكري' : 'My Tickets'}
        description={
          isAr
            ? 'عرض وإدارة تذاكرك المحجوزة لدى خليجي تور'
            : 'View and manage your Khaleeji Tour booked tickets and digital QR passes.'
        }
        noIndex={true}
      />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-xs">
              <TicketIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-sans text-foreground">
                {t('myTickets.title', 'My Tickets')}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {t(
                  'myTickets.subtitle',
                  'View your booked event passes, table assignments, and gate QR codes.'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Explore Events Quick CTA */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-secondary/30 hover:bg-secondary/60 text-foreground border border-border px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors self-start md:self-auto"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span>{t('myTickets.exploreEvents', 'Explore Events')}</span>
          <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
        </Link>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center p-1 bg-secondary/20 border border-border rounded-xl self-start">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('myTickets.filterAll', 'All Tickets')} ({tickets?.length || 0})
          </button>

          <button
            onClick={() => setActiveFilter('upcoming')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'upcoming'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('myTickets.filterUpcoming', 'Upcoming')} ({upcomingCount})
          </button>

          <button
            onClick={() => setActiveFilter('past')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'past'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('myTickets.filterPast', 'Past / Used')} ({pastCount})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search
            className={`absolute ${isAr ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(
              'myTickets.searchPlaceholder',
              'Search by event name, ticket code, venue...'
            )}
            className={`w-full bg-background border border-input rounded-xl py-2.5 ${
              isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'
            } text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-card border border-border rounded-2xl p-5 space-y-4 animate-pulse shadow-sm"
            >
              <div className="h-40 bg-muted/60 rounded-xl" />
              <div className="h-4 bg-muted/60 rounded w-3/4" />
              <div className="h-3 bg-muted/60 rounded w-1/2" />
              <div className="h-16 bg-muted/40 rounded-xl" />
              <div className="h-10 bg-muted/60 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm text-destructive font-semibold">
            {t('myTickets.errorLoading', 'Failed to load your tickets. Please try again.')}
          </p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('common.retry', 'Retry')}</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredTickets.length === 0 && (
        <div className="bg-card border border-border rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
          <div className="w-20 h-20 rounded-3xl bg-secondary/30 text-primary flex items-center justify-center border border-border">
            <TicketIcon className="w-10 h-10 opacity-60" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="font-bold text-lg text-foreground">
              {searchQuery
                ? t('myTickets.noSearchResults', 'No tickets match your search')
                : activeFilter === 'upcoming'
                  ? t('myTickets.noUpcomingTickets', 'No upcoming tickets')
                  : t('myTickets.noTicketsYet', 'No tickets found')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {searchQuery
                ? t(
                    'myTickets.tryDifferentSearch',
                    'Try searching for a different event or ticket code.'
                  )
                : t(
                    'myTickets.noTicketsDesc',
                    'You have not booked any tickets yet. Explore our upcoming events and reserve your tables now!'
                  )}
            </p>
          </div>
          {!searchQuery && (
            <Link
              to="/"
              className="mt-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('myTickets.browseEventsBtn', 'Browse Events')}</span>
            </Link>
          )}
        </div>
      )}

      {/* Tickets Grid */}
      {!isLoading && !isError && filteredTickets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onOpenPass={handleOpenPass} />
          ))}
        </div>
      )}

      {/* Full QR Pass Modal */}
      <TicketModal
        ticket={selectedTicket}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default MyTicketsPage;
