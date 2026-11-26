/**
 * EventInfoPanel
 *
 * Purpose: Left sidebar displaying event information on the Event Details page.
 * Input: event object from Supabase
 * Output: Rendered event info panel (image, title, date, venue, description)
 * Dependencies: react-i18next, lucide-react, react-router-dom
 */
import { memo, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import AppImage from '../common/AppImage';

const EventInfoPanel = memo(({ event }) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const isSoon = event?.status === 'soon';

  // Bilingual field helpers
  const title = isArabic && event?.title_ar ? event.title_ar : event?.title_en;
  const venue = isArabic && event?.venue_ar ? event.venue_ar : event?.venue_en;
  const city = isArabic && event?.city_ar ? event.city_ar : event?.city_en;
  const description =
    isArabic && event?.description_ar ? event.description_ar : event?.description_en;

  // Build images list
  const imageList = useMemo(() => {
    const list =
      Array.isArray(event?.images) && event.images.length > 0
        ? event.images
        : event?.cover_image_url
          ? [event.cover_image_url]
          : [];
    if (event?.cover_image_url && !list.includes(event.cover_image_url)) {
      return [event.cover_image_url, ...list];
    }
    return list.filter(Boolean);
  }, [event?.images, event?.cover_image_url]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const hasMultipleImages = imageList.length > 1;

  const handlePrevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
  };

  const mainImageAlt = useMemo(() => {
    const venuePart = venue ? ` - ${venue}` : '';
    const cityPart = city ? `, ${city}` : '';
    const numberPart = hasMultipleImages
      ? ` (${isArabic ? 'صورة' : 'Photo'} ${currentImageIndex + 1})`
      : '';
    return isArabic
      ? `بوستر حفل ${title}${venuePart}${cityPart} - تذاكر خليجي تور${numberPart}`
      : `${title} Concert Poster${venuePart}${cityPart} - Khaleeji Tour Tickets${numberPart}`;
  }, [title, venue, city, isArabic, hasMultipleImages, currentImageIndex]);

  // Date formatting
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr)
      .toLocaleDateString(isArabic ? 'ar-EG' : 'en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
      .toUpperCase();
  };

  // Time formatting
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString(isArabic ? 'ar-EG' : 'en-GB', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    });
  };

  return (
    <aside
      className="flex flex-col gap-5"
      aria-label={t('eventDetails.eventInfo', 'Event Information')}
    >
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group w-fit"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        <span className="uppercase tracking-wider font-medium">
          {t('eventDetails.backToEvents', 'Back to Events')}
        </span>
      </Link>

      {/* Main Image with Carousel */}
      {imageList.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="relative rounded-xl overflow-hidden border border-border aspect-4/5 max-w-[450px] mx-auto w-full bg-[#12100B] select-none">
            {isSoon && (
              <div className="absolute top-3 right-3 z-10 bg-amber-500 text-black text-xs font-extrabold uppercase px-3 py-1 rounded-full shadow-xl flex items-center gap-1.5 tracking-wider animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('events.comingSoon', 'COMING SOON')}</span>
              </div>
            )}

            {/* Counter badge */}
            {hasMultipleImages && (
              <div className="absolute top-3 left-3 z-10 bg-black/70 backdrop-blur-md text-white/90 border border-white/10 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full shadow-lg">
                {currentImageIndex + 1}/{imageList.length}
              </div>
            )}

            <AppImage
              key={imageList[currentImageIndex]}
              src={imageList[currentImageIndex]}
              alt={mainImageAlt}
              priority={true}
              className="w-full h-full object-contain object-top"
              containerClassName="w-full h-full"
            />

            {/* Left & Right Navigation Arrows */}
            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  aria-label="Previous image"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/75 hover:bg-primary hover:text-black text-white border border-white/20 hover:border-primary flex items-center justify-center backdrop-blur-md shadow-lg transition-all duration-200 opacity-90 hover:opacity-100 hover:scale-110 active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={handleNextImage}
                  aria-label="Next image"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/75 hover:bg-primary hover:text-black text-white border border-white/20 hover:border-primary flex items-center justify-center backdrop-blur-md shadow-lg transition-all duration-200 opacity-90 hover:opacity-100 hover:scale-110 active:scale-95"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Mini Thumbnails Strip */}
          {hasMultipleImages && (
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none max-w-[450px] mx-auto w-full">
              {imageList.map((imgUrl, idx) => (
                <button
                  key={imgUrl}
                  type="button"
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative w-14 h-16 rounded-lg overflow-hidden border shrink-0 transition-all duration-200 ${
                    idx === currentImageIndex
                      ? 'border-primary ring-2 ring-primary/40 scale-105 shadow-md'
                      : 'border-border/60 opacity-60 hover:opacity-100'
                  }`}
                >
                  <AppImage
                    src={imgUrl}
                    alt={
                      isArabic
                        ? `مصغّر صورة فعالية ${title} (${idx + 1})`
                        : `${title} - Gallery Photo ${idx + 1}`
                    }
                    className="w-full h-full object-cover"
                    containerClassName="w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Title */}
      <h1 className="text-xl lg:text-2xl font-serif font-bold text-foreground uppercase tracking-wide leading-tight">
        {title}
      </h1>

      {/* Meta info */}
      <div className="flex flex-col gap-3">
        {/* Date */}
        {event?.start_date ? (
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            <span>{formatDate(event.start_date)}</span>
          </div>
        ) : isSoon ? (
          <div className="flex items-center gap-2.5 text-sm text-amber-400 font-medium">
            <Calendar className="w-4 h-4 shrink-0" />
            <span>{t('events.dateTba', 'Date to be announced')}</span>
          </div>
        ) : null}

        {/* Time */}
        {event?.start_date ? (
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span>
              {formatTime(event.start_date)}
              {event.end_date && ` – ${formatTime(event.end_date)}`}
            </span>
          </div>
        ) : null}

        {/* Venue */}
        {venue ? (
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <span>
              {venue}
              {city && `, ${city}`}
            </span>
          </div>
        ) : isSoon ? (
          <div className="flex items-center gap-2.5 text-sm text-amber-400 font-medium">
            <MapPin className="w-4 h-4 shrink-0" />
            <span>{t('events.venueTba', 'Venue to be announced')}</span>
          </div>
        ) : null}
      </div>

      {/* Description */}
      {description && (
        <div className="text-sm text-muted-foreground leading-relaxed border-t border-border pt-4 whitespace-pre-line font-sans">
          {description}
        </div>
      )}

      {/* Starting price */}
      {Number(event?.starting_price) > 0 && !isSoon && (
        <div className="border-t border-border pt-4">
          <span className="text-xs text-muted-foreground uppercase tracking-widest block mb-1">
            {t('eventDetails.startingFrom', 'Starting from')}
          </span>
          <span className="text-2xl font-serif font-bold text-primary">
            ${Number(event.starting_price).toFixed(2)}
            <span className="text-sm font-normal text-muted-foreground ms-1">
              {event.currency || 'CAD'}
            </span>
          </span>
        </div>
      )}
    </aside>
  );
});

EventInfoPanel.displayName = 'EventInfoPanel';
export { EventInfoPanel };
