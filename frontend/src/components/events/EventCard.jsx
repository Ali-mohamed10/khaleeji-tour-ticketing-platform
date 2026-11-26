import { useState, useMemo } from 'react';
import { Calendar, MapPin, Clock, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import AppImage from '../common/AppImage';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCardImageFallback, getCardImageSrc } from '../../utils/imageUrl';

export const EventCard = ({ event, priority = false }) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const isSoon = event?.status === 'soon';

  const title = isArabic && event.title_ar ? event.title_ar : event.title_en;
  const venueName = isArabic && event.venue_ar ? event.venue_ar : event.venue_en;

  // Build list of all available event images
  const imageList = useMemo(() => {
    const list =
      Array.isArray(event.images) && event.images.length > 0
        ? event.images
        : event.cover_image_url
          ? [event.cover_image_url]
          : [];
    if (event.cover_image_url && !list.includes(event.cover_image_url)) {
      return [event.cover_image_url, ...list];
    }
    return list.filter(Boolean);
  }, [event.images, event.cover_image_url]);

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

  const imageAltText = useMemo(() => {
    const venuePart = venueName ? ` - ${venueName}` : '';
    const imageNumberPart = hasMultipleImages ? ` (${isArabic ? 'صورة' : 'Image'} ${currentImageIndex + 1})` : '';
    return isArabic
      ? `بوستر فعالية ${title}${venuePart} - خليجي تور${imageNumberPart}`
      : `${title} Event Poster${venuePart} - Khaleeji Tour${imageNumberPart}`;
  }, [title, venueName, isArabic, hasMultipleImages, currentImageIndex]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date
      .toLocaleDateString(isArabic ? 'ar-EG' : 'en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
      .toUpperCase();
  };

  const formatTimeRange = (startStr, endStr) => {
    if (!startStr) return '';
    const startDate = new Date(startStr);
    const options = { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' };
    const startTime = startDate.toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US', options);

    if (!endStr) return startTime;
    const endDate = new Date(endStr);
    const endTime = endDate.toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US', options);

    return `${startTime} - ${endTime}`;
  };

  return (
    <Link to={`/events/${event.slug}`} className="block h-full">
      <div className="group relative rounded-2xl border border-primary/40 bg-secondary/20 hover:bg-secondary/35 backdrop-blur-sm p-3.5 overflow-hidden hover:border-primary/60 transition-all duration-300 flex flex-col h-full shadow-premium hover:shadow-[0_0_20px_rgba(201,169,107,0.2)]">
        {/* Framed Image container with carousel */}
        <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-border/60 bg-[#12100B] w-full shrink-0 select-none">
          {isSoon && (
            <div className="absolute top-2.5 right-2.5 z-10 bg-amber-500 text-black text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>{t('events.comingSoon', 'COMING SOON')}</span>
            </div>
          )}

          {/* Image index counter */}
          {hasMultipleImages && (
            <div className="absolute top-2.5 left-2.5 z-10 bg-black/60 backdrop-blur-md text-white/90 border border-white/10 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shadow-md">
              {currentImageIndex + 1}/{imageList.length}
            </div>
          )}

          {imageList.length > 0 ? (
            <AppImage
              key={imageList[currentImageIndex]}
              src={getCardImageSrc(event, imageList[currentImageIndex])}
              fallbackSrc={getCardImageFallback(event, imageList[currentImageIndex])}
              alt={imageAltText}
              priority={priority && currentImageIndex === 0}
              className="w-full h-full object-contain object-top transition-transform duration-700 group-hover:scale-105"
              containerClassName="w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-secondary/50 flex items-center justify-center">
              <span className="text-muted-foreground text-xs font-medium">No Cover Image</span>
            </div>
          )}

          {/* Left & Right Navigation Scroll Arrows */}
          {hasMultipleImages && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                aria-label="Previous image"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/70 hover:bg-primary hover:text-black text-white border border-white/20 hover:border-primary flex items-center justify-center backdrop-blur-md shadow-lg transition-all duration-200 opacity-90 hover:opacity-100 hover:scale-110 active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleNextImage}
                aria-label="Next image"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/70 hover:bg-primary hover:text-black text-white border border-white/20 hover:border-primary flex items-center justify-center backdrop-blur-md shadow-lg transition-all duration-200 opacity-90 hover:opacity-100 hover:scale-110 active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Dots indicator */}
              <div className="absolute bottom-2 inset-x-0 z-10 flex items-center justify-center gap-1.5 pointer-events-none">
                {imageList.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 shadow-xs ${
                      idx === currentImageIndex ? 'w-4 bg-primary' : 'w-1.5 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col grow pt-3.5">
          <div className="space-y-2 mb-4">
            <h3 className="text-base font-serif text-primary mb-1 uppercase tracking-wider font-bold drop-shadow-md line-clamp-2">
              {title}
            </h3>

            {event.start_date ? (
              <>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                  <span>{formatDate(event.start_date)}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                  <span>{formatTimeRange(event.start_date, event.end_date)}</span>
                </div>
              </>
            ) : isSoon ? (
              <div className="flex items-center gap-2 text-xs text-amber-400/90 font-medium">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>{t('events.dateTba', 'Date to be announced')}</span>
              </div>
            ) : null}

            {venueName ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                <span className="line-clamp-1">{venueName}</span>
              </div>
            ) : isSoon ? (
              <div className="flex items-center gap-2 text-xs text-amber-400/90 font-medium">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{t('events.venueTba', 'Venue to be announced')}</span>
              </div>
            ) : null}
          </div>

          {/* Footer with Price and Button */}
          <div className="mt-auto flex items-center justify-between pt-3.5 border-t border-border/40">
            {isSoon ? (
              <>
                <div className="flex flex-col">
                  <span className="text-[11px] text-amber-400/80 uppercase tracking-widest font-semibold">
                    {t('events.stayTuned', 'STAY TUNED')}
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {t('events.ticketsSoon', 'Tickets Soon')}
                  </span>
                </div>

                <div className="bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold py-1.5 px-4 rounded-lg text-xs uppercase tracking-wider">
                  {t('events.soonBtn', 'SOON')}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col">
                  <span className="text-[12px] text-muted-foreground uppercase tracking-widest">
                    {t('events.from', 'FROM')}
                  </span>
                  <span className="text-2xl font-serif font-bold text-primary">
                    ${event.starting_price || 0}
                  </span>
                </div>

                <div className="bg-[#D4AF37] hover:bg-[#B8860B] text-black font-semibold py-1.5 px-4 rounded-lg text-xs uppercase tracking-wider transition-colors duration-300">
                  {t('events.bookNow', 'BOOK NOW')}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
