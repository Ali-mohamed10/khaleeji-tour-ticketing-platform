/**
 * EventDetailsPage
 *
 * Purpose: Public event details page at /events/:slug.
 *          Three-column layout: Event Info | Seat Map | Booking + Checkout.
 * Input: slug from URL params
 * Output: Full event page with interactive seat map and booking flow
 * Dependencies: useEventBySlug, InteractiveSeatMap, BookingSummaryCard, CheckoutCard
 */
import { useState, useCallback, useMemo, useEffect, lazy, Suspense } from 'react';
import { useParams, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { useEventBySlug } from '../../hooks/useEvents';
import { useRealtimeTables } from '../../hooks/useRealtimeTables';

import { EventInfoPanel } from '../../components/event/EventInfoPanel';
import { EventPromoVideo } from '../../components/events/EventPromoVideo';
import { EventDetailsSkeleton } from '../../components/event/EventDetailsSkeleton';
import { SeatMapLegend } from '../../components/seatmap/SeatMapLegend';
import { BookingSummaryCard } from '../../components/booking/BookingSummaryCard';
import { getStoredSeats, saveStoredSeats } from '../../utils/seatStorage';
import { getStoredCoupon, saveStoredCoupon, clearStoredCoupon } from '../../utils/couponStorage';
import { SEO } from '../../components/common/SEO';

const InteractiveSeatMap = lazy(() =>
  import('../../components/seatmap/InteractiveSeatMap').then((m) => ({
    default: m.InteractiveSeatMap,
  }))
);

const CheckoutCard = lazy(() =>
  import('../../components/booking/CheckoutCard').then((m) => ({
    default: m.CheckoutCard,
  }))
);

const MapLoader = () => (
  <div className="flex items-center justify-center h-96 bg-secondary/10 rounded-lg border border-border">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const CheckoutLoader = () => (
  <div className="flex items-center justify-center min-h-48 rounded-lg border border-border bg-secondary/10">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Tax rate constant (Ontario HST 13%)
const SERVICE_FEE_RATE = 0.13;

export const EventDetailsPage = () => {
  const { slug } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  // Fetch event with seat map and tables
  const { data: event, isLoading, error } = useEventBySlug(slug);

  // SEO metadata & Structured Data (Schema.org Event)
  const eventTitle = isArabic && event?.title_ar ? event.title_ar : (event?.title_en || 'Event');
  const eventDesc = (isArabic && event?.description_ar ? event.description_ar : event?.description_en) || event?.seo_description || '';
  const cleanSnippetDesc = eventDesc ? eventDesc.replace(/[\r\n]+/g, ' ').slice(0, 160) : '';

  const eventJsonLd = useMemo(() => {
    if (!event) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: eventTitle,
      description: cleanSnippetDesc || undefined,
      image: event.images && event.images.length > 0 ? event.images : [event.cover_image_url].filter(Boolean),
      startDate: event.start_date || undefined,
      endDate: event.end_date || undefined,
      eventStatus: event.status === 'cancelled' ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: (isArabic && event.venue_ar ? event.venue_ar : event.venue_en) || 'NAI Restaurant Windsor',
        address: {
          '@type': 'PostalAddress',
          addressLocality: (isArabic && event.city_ar ? event.city_ar : event.city_en) || 'Windsor',
          addressRegion: 'ON',
          addressCountry: (isArabic && event.country_ar ? event.country_ar : event.country_en) || 'CA',
        },
      },
      offers: {
        '@type': 'Offer',
        url: typeof window !== 'undefined' ? window.location.href : '',
        price: event.starting_price || 0,
        priceCurrency: event.currency || 'CAD',
        availability: event.status === 'published' ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
        validFrom: event.created_at || undefined,
      },
      organizer: {
        '@type': 'Organization',
        name: 'Khaleeji Tour',
        url: 'https://www.khaleejitour.com',
      },
    };
  }, [event, eventTitle, cleanSnippetDesc, isArabic]);

  // Fire-and-forget: clean up expired reservation holds so seat map is fresh
  useEffect(() => {
    const apiBase = import.meta.env?.VITE_API_BASE_URL ?? (import.meta.env?.DEV ? 'http://localhost:3001' : '');
    fetch(`${apiBase}/api/cleanup-expired`, { method: 'POST' }).catch(() => {});
  }, [slug]);

  // Subscribe to real-time table status updates
  useRealtimeTables(event?.seat_maps?.id || event?.seat_map_id, slug, event?.id);

  // Selected tables state
  const [selectedTables, setSelectedTables] = useState([]);
  const [isCheckingOut, setIsCheckingOut] = useState(() => {
    return searchParams.get('checkout') === 'true' || Boolean(location.state?.isCheckingOut);
  });
  const [hasRestoredFromStorage, setHasRestoredFromStorage] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Preload checkout chunk when restoring checkout deep-link / state
  useEffect(() => {
    if (isCheckingOut) {
      import('../../components/booking/CheckoutCard');
    }
  }, [isCheckingOut]);

  // Restore stored seats and applied coupon from localStorage when event data is ready
  useEffect(() => {
    if (!event || hasRestoredFromStorage) return;
    const stored = getStoredSeats(event.id, slug);
    if (stored && stored.length > 0 && event?.seat_maps?.tables) {
      const dbTables = event.seat_maps.tables;
      // Filter out sold tables and sync with database tables
      const validRestored = stored
        .map((s) => {
          const dbTable = dbTables.find((d) => d.id === s.id || d.table_code === s.table_code);
          if (!dbTable || dbTable.status === 'sold') return null;
          return {
            ...dbTable,
            selectedSeatsCount: s.selectedSeatsCount || 1,
          };
        })
        .filter(Boolean);

      if (validRestored.length > 0) {
        setSelectedTables(validRestored);
      }
    }

    // Restore applied coupon from localStorage
    const storedCoupon = getStoredCoupon(event.id);
    if (storedCoupon) {
      setAppliedCoupon(storedCoupon);
    }

    setHasRestoredFromStorage(true);
  }, [event, slug, hasRestoredFromStorage]);

  // When stored seats are restored and URL/state requested checkout mode, activate checkout
  useEffect(() => {
    if (!hasRestoredFromStorage) return;
    const shouldCheckout =
      searchParams.get('checkout') === 'true' || Boolean(location.state?.isCheckingOut);
    if (shouldCheckout && selectedTables.length > 0) {
      setIsCheckingOut(true);
    }
  }, [hasRestoredFromStorage, selectedTables.length, searchParams, location.state]);

  // Persist seat selections to localStorage whenever selectedTables changes
  useEffect(() => {
    if (!hasRestoredFromStorage || !event?.id) return;
    saveStoredSeats(event.id, slug, selectedTables);
  }, [selectedTables, event?.id, slug, hasRestoredFromStorage]);

  // Persist applied coupon to localStorage whenever appliedCoupon changes
  useEffect(() => {
    if (!hasRestoredFromStorage || !event?.id) return;
    if (appliedCoupon) {
      saveStoredCoupon(event.id, appliedCoupon);
    } else {
      clearStoredCoupon(event.id);
    }
  }, [appliedCoupon, event?.id, hasRestoredFromStorage]);

  const handleApplyCoupon = useCallback((coupon) => {
    setAppliedCoupon(coupon);
    if (event?.id) {
      saveStoredCoupon(event.id, coupon);
    }
  }, [event?.id]);

  const handleRemoveCoupon = useCallback(() => {
    setAppliedCoupon(null);
    if (event?.id) {
      clearStoredCoupon(event.id);
    }
  }, [event?.id]);

  // Handlers for mobile checkout view toggling with URL synchronization
  const handleProceedToCheckout = useCallback(() => {
    setIsCheckingOut(true);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('checkout', 'true');
      return next;
    }, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setSearchParams]);

  const handleBackToSeats = useCallback(() => {
    setIsCheckingOut(false);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('checkout');
      return next;
    }, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setSearchParams]);

  // Ensure smooth scroll to top when entering checkout mode on mobile
  useEffect(() => {
    if (isCheckingOut) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isCheckingOut]);

  // Auto-reset checkout mode when no tables selected (only after initial storage restore)
  useEffect(() => {
    if (hasRestoredFromStorage && selectedTables.length === 0) {
      setIsCheckingOut(false);
      if (searchParams.get('checkout') === 'true') {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete('checkout');
          return next;
        }, { replace: true });
      }
    }
  }, [hasRestoredFromStorage, selectedTables.length, searchParams, setSearchParams]);

  // Auto-remove any selected table if it becomes sold in real-time
  useEffect(() => {
    if (!event?.seat_maps?.tables || selectedTables.length === 0) return;
    const dbTables = event.seat_maps.tables;
    const hasSoldSelected = selectedTables.some((selected) => {
      const matchingDb = dbTables.find(
        (d) => d.id === selected.id || d.table_code === selected.table_code
      );
      return matchingDb && matchingDb.status === 'sold';
    });

    if (hasSoldSelected) {
      setSelectedTables((prev) =>
        prev.filter((selected) => {
          const matchingDb = dbTables.find(
            (d) => d.id === selected.id || d.table_code === selected.table_code
          );
          if (!matchingDb) return true;
          return matchingDb.status !== 'sold';
        })
      );
    }
  }, [event?.seat_maps?.tables, selectedTables]);

  // Helper to match tables reliably across db_id, id, and table_code
  const isMatchingTable = (t1, t2) => {
    if (!t1 || !t2) return false;
    if (t1.id && t2.id && t1.id === t2.id) return true;
    if (t1.db_id && t2.id && t1.db_id === t2.id) return true;
    if (t1.id && t2.db_id && t1.id === t2.db_id) return true;
    if (t1.db_id && t2.db_id && t1.db_id === t2.db_id) return true;
    const code1 = (t1.table_code || t1.id || '').toString().replace(/^#+/, '').trim().toUpperCase();
    const code2 = (t2.table_code || t2.id || '').toString().replace(/^#+/, '').trim().toUpperCase();
    return !!code1 && !!code2 && code1 === code2;
  };

  // Toggle table selection (Multi-Select)
  const handleTableSelect = useCallback((table, count) => {
    setSelectedTables((prev) => {
      const exists = prev.find((t) => isMatchingTable(t, table));
      if (exists) {
        // Deselect table
        return prev.filter((t) => !isMatchingTable(t, table));
      }
      // Multi-select: append newly selected table with specified count or default 1
      const dbTables = event?.seat_maps?.tables || [];
      const cleanTableCode = (table.table_code || table.id || '').replace(/^#+/, '').trim().toUpperCase();
      const matchedDb = dbTables.find(
        (d) =>
          d.id === table.db_id ||
          d.id === table.id ||
          (d.table_code || '').replace(/^#+/, '').trim().toUpperCase() === cleanTableCode
      );

      return [
        ...prev,
        {
          ...table,
          id: matchedDb?.id || table.db_id || table.id,
          db_id: matchedDb?.id || table.db_id,
          table_code: matchedDb?.table_code || table.table_code || table.id,
          price: matchedDb?.price ? parseFloat(matchedDb.price) : table.price,
          selectedSeatsCount: count || 1,
        },
      ];
    });
  }, [event?.seat_maps?.tables]);

  // Update selected seats count for a specific table
  const handleSeatsCountChange = useCallback((tableIdentifier, newCount) => {
    setSelectedTables((prev) =>
      prev.map((t) => {
        if (
          t.id === tableIdentifier ||
          t.db_id === tableIdentifier ||
          (t.table_code &&
            t.table_code.replace(/^#+/, '').toUpperCase() ===
              String(tableIdentifier).replace(/^#+/, '').toUpperCase())
        ) {
          return { ...t, selectedSeatsCount: newCount };
        }
        return t;
      })
    );
  }, []);

  // Calculate grand total for checkout card taking applied coupon into account
  const grandTotal = useMemo(() => {
    const ticketTotal = selectedTables.reduce(
      (sum, tbl) => sum + parseFloat(tbl.price || 0) * (tbl.selectedSeatsCount || 1),
      0
    );
    const discountAmount = appliedCoupon?.discountPercent
      ? (ticketTotal * appliedCoupon.discountPercent) / 100
      : 0;
    const netTicketTotal = Math.max(0, ticketTotal - discountAmount);
    return netTicketTotal + netTicketTotal * SERVICE_FEE_RATE;
  }, [selectedTables, appliedCoupon]);

  // Build seat map data structure for InteractiveSeatMap
  const seatMapData = useMemo(() => {
    if (!event?.seat_maps) return null;
    return {
      ...event.seat_maps,
      tables: event.seat_maps.tables || [],
    };
  }, [event?.seat_maps]);

  // Loading state
  if (isLoading) {
    return <EventDetailsSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <span className="text-2xl">⚠</span>
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {t('errors.eventNotFound', 'Event Not Found')}
        </h2>
        <p className="text-muted-foreground text-sm text-center max-w-md">
          {t('errors.eventNotFoundDesc', "We can't seem to find the event you're looking for.")}
        </p>
      </div>
    );
  }

  // No event found
  if (!event) return null;

  // Coming Soon Teaser View
  if (event.status === 'soon') {
    return (
      <div className="animate-fade-in-up pb-16">
        <SEO
          title={`${eventTitle} (${isArabic ? 'قريباً' : 'Coming Soon'})`}
          description={cleanSnippetDesc || (isArabic ? `ترقبوا حفل ${eventTitle} مع خليجي تور` : `Coming soon: ${eventTitle} by Khaleeji Tour`)}
          image={event.cover_image_url}
          type="event"
          structuredData={eventJsonLd}
        />
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] xl:grid-cols-[430px_1fr] gap-8 items-start">
          {/* Left — Event Poster & Info & Promo Video */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto scrollbar-none pr-1">
            <EventInfoPanel event={event} />
            <EventPromoVideo event={event} />
          </aside>

          {/* Right — Coming Soon Teaser Showcase Banner */}
          <div className="flex flex-col justify-center items-center text-center p-8 md:p-12 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-secondary/10 to-transparent backdrop-blur-md shadow-2xl space-y-6 min-h-[420px]">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.3)] animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-3 max-w-lg">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30">
                ✨ {t('events.comingSoon', 'COMING SOON')}
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                {t('eventDetails.comingSoonHeading', 'Seat Reservations Opening Soon')}
              </h2>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {t(
                  'eventDetails.comingSoonSubtext',
                  'We are finalizing the seating arrangement and schedule for this event. Ticket booking will open shortly. Stay tuned!'
                )}
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <Link
                to="/"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 py-2.5 rounded-lg text-sm transition-colors"
              >
                ← {t('eventDetails.exploreOtherEvents', 'Explore Upcoming Events')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`animate-fade-in-up ${selectedTables.length > 0 && !isCheckingOut ? 'pb-28 md:pb-0' : ''}`}
    >
      <SEO
        title={eventTitle}
        description={cleanSnippetDesc || (isArabic ? `احجز تذاكر حفل ${eventTitle} مع خليجي تور` : `Book tickets for ${eventTitle} live concert with Khaleeji Tour`)}
        image={event.cover_image_url}
        type="event"
        structuredData={eventJsonLd}
      />

      {/* Desktop: Two-column layout (Left: Event Info, Right: Seat Map + Booking/Checkout subgrid) */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] xl:grid-cols-[430px_1fr] 2xl:grid-cols-[460px_1fr] gap-8 items-start">
        {/* Left — Event Info & Promo Video */}
        <aside className={`space-y-6 ${isCheckingOut ? 'hidden lg:block' : ''} lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto scrollbar-none pr-1`}>
          <EventInfoPanel event={event} />
          <EventPromoVideo event={event} />
        </aside>

        {/* Right — Seat Map & Bottom Billing/Checkout Cards */}
        <div className="flex flex-col gap-6 w-full">
          {/* Seat Map */}
          {seatMapData ? (
            <div className={`flex-col gap-4 ${isCheckingOut ? 'hidden lg:flex' : 'flex'}`}>
              <Suspense fallback={<MapLoader />}>
                <InteractiveSeatMap
                  seatMap={seatMapData}
                  onTableSelect={handleTableSelect}
                  selectedTables={selectedTables}
                  onSeatsCountChange={handleSeatsCountChange}
                />
              </Suspense>
              <SeatMapLegend seatMapSlug={seatMapData?.slug} />
            </div>
          ) : (
            <div
              className={`flex items-center justify-center h-96 bg-secondary/10 rounded-lg border border-border text-muted-foreground ${isCheckingOut ? 'hidden lg:flex' : 'flex'}`}
            >
              {t('eventDetails.noSeatMap', 'No seat map available for this event.')}
            </div>
          )}

          {/* Booking Summary & Checkout Cards side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={isCheckingOut ? 'hidden md:block' : ''}>
              <BookingSummaryCard
                eventId={event.id}
                selectedTables={selectedTables}
                currency={event.currency || 'CAD'}
                appliedCoupon={appliedCoupon}
                onApplyCoupon={handleApplyCoupon}
                onRemoveCoupon={handleRemoveCoupon}
                onSeatsCountChange={handleSeatsCountChange}
                onTableSelect={handleTableSelect}
              />
            </div>
            <div className={!isCheckingOut ? 'hidden md:block' : ''}>
              {isCheckingOut && (
                <button
                  onClick={handleBackToSeats}
                  className="md:hidden mb-4 flex items-center gap-2 text-primary font-semibold text-sm hover:underline cursor-pointer"
                >
                  <span className="inline-block rtl:rotate-180">←</span>
                  <span>{t('eventDetails.backToSeats', 'Back to Seat Selection')}</span>
                </button>
              )}
              <Suspense fallback={<CheckoutLoader />}>
                <CheckoutCard
                  eventId={event.id}
                  selectedTables={selectedTables}
                  grandTotal={grandTotal}
                  currency={event.currency || 'CAD'}
                  appliedCoupon={appliedCoupon}
                  onApplyCoupon={handleApplyCoupon}
                  onRemoveCoupon={handleRemoveCoupon}
                  disabled={selectedTables.length === 0}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky checkout bar */}
      {selectedTables.length > 0 && !isCheckingOut && (
        <div className="fixed bottom-0 inset-x-0 md:hidden bg-card border-t border-border p-4 shadow-premium-top z-40">
          <div className="flex items-center flex-wrap justify-center container mx-auto">
            <button
              onClick={handleProceedToCheckout}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity shrink-0"
            >
              {t('seatMap.proceedToCheckout', 'Proceed to Checkout')} →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailsPage;
