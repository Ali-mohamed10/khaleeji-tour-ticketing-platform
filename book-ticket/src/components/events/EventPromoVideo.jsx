/**
 * EventPromoVideo Component
 *
 * Purpose: Displays luxury promo teasers/reels on the Event Details page.
 * Design: Matches the Event Images gallery with a main featured viewer,
 *         1/N counter badge, left/right navigation arrows, and a mini thumbnail strip.
 * Performance: Uses smart lazy loading (preload="none"), event cover as poster,
 *              and lightweight video modal player with zero initial layout shift.
 */
import { useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Play,
  Sparkles,
  Film,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useEventVideos } from '../../hooks/useVideos';
import { formatVideoDuration } from '../../services/videoService';
import { VideoModal } from '../common/VideoModal';

export const EventPromoVideo = memo(({ event }) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const eventId = event?.id;
  const { data: videos = [], isLoading } = useEventVideos(eventId);

  // Active index in carousel
  const [currentIndex, setCurrentIndex] = useState(0);

  // Modal state
  const [isOpenModal, setIsOpenModal] = useState(false);

  // Fallback: show the local promo if no DB videos and it's a Titan event
  const displayVideos = videos.length > 0
    ? videos
    : (event?.slug?.includes('titan')
      ? [{
          id: 'fallback',
          video_url: '/videos/khaleeji-tour-titan-edition-promo.mp4',
          title_en: 'Khaleeji Tour Official Teaser',
          title_ar: 'الإعلان التشويقي لفعالية خليجي تور',
          duration_seconds: 70,
        }]
      : []);

  const totalVideos = displayVideos.length;
  const hasMultipleVideos = totalVideos > 1;

  // Safe active video
  const activeVideo = displayVideos[currentIndex] || displayVideos[0] || null;

  const handlePrevVideo = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? totalVideos - 1 : prev - 1));
  }, [totalVideos]);

  const handleNextVideo = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === totalVideos - 1 ? 0 : prev + 1));
  }, [totalVideos]);

  const handleCloseModal = useCallback(() => {
    setIsOpenModal(false);
  }, []);

  const handleOpenModal = useCallback(() => {
    if (!activeVideo) return;
    setIsOpenModal(true);
  }, [activeVideo]);

  // Don't render if no videos and not a titan fallback
  if (totalVideos === 0 && !isLoading) return null;

  // Poster resolution (custom video poster -> event cover -> fallback)
  const getPosterUrl = (video) =>
    video?.thumbnail_url || event?.cover_image_url || video?.events?.cover_image_url || 'https://zqkxlbezduyilengqcvv.supabase.co/storage/v1/object/public/event-images/events/temp_1787316642713/cover_1787316643447.webp';

  const activePosterUrl = getPosterUrl(activeVideo);
  const activeTitle = isAr
    ? (activeVideo?.title_ar || activeVideo?.title_en || 'الإعلان التشويقي لفعالية خليجي تور')
    : (activeVideo?.title_en || activeVideo?.title_ar || 'Khaleeji Tour Official Teaser');

  return (
    <div className="w-full space-y-3 pt-2">
      {/* Section Header Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <Film className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            {t('eventDetails.promoVideo', 'Event Promo Teaser')}
          </span>
        </div>

        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <Sparkles className="w-2.5 h-2.5" />
          {t('eventDetails.officialTrailer', 'Official Teaser')}
        </span>
      </div>

      {/* Main Video Card Frame with Navigation Carousel */}
      <div className="flex flex-col gap-2.5">
        <div
          onClick={handleOpenModal}
          className="group relative w-full aspect-9/16 max-h-[380px] rounded-2xl overflow-hidden border border-border hover:border-primary/50 shadow-md hover:shadow-premium-val transition-all duration-300 cursor-pointer bg-[#12100B] flex items-center justify-center select-none"
        >
          {/* Background Poster Image */}
          <img
            key={activePosterUrl + currentIndex}
            src={activePosterUrl}
            alt={activeTitle}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = event?.cover_image_url || 'https://zqkxlbezduyilengqcvv.supabase.co/storage/v1/object/public/event-images/events/temp_1787316642713/cover_1787316643447.webp';
            }}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-85 group-hover:opacity-95 group-hover:scale-105 transition-all duration-500"
          />

          {/* Dark Luxury Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/60 group-hover:via-black/20 transition-all duration-300" />

          {/* Counter Badge (e.g. 1/3) */}
          {hasMultipleVideos && (
            <div className="absolute top-3 left-3 z-20 bg-black/70 backdrop-blur-md text-white/90 border border-white/10 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full shadow-lg">
              {currentIndex + 1}/{totalVideos}
            </div>
          )}

          {/* Duration Badge */}
          {activeVideo?.duration_seconds ? (
            <div className={`absolute top-3 ${hasMultipleVideos ? 'right-3' : 'left-3'} z-20`}>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-black/70 backdrop-blur-xs text-white border border-white/10 shadow-lg">
                {formatVideoDuration(activeVideo.duration_seconds)}
              </span>
            </div>
          ) : null}

          {/* Center Pulsating Gold Play Button */}
          <div className="relative z-10 w-14 h-14 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform duration-300 border-2 border-primary-foreground/30">
            <Play className="w-6 h-6 fill-current ml-0.5 text-[#1B120F]" />
          </div>

          {/* Left & Right Navigation Arrows */}
          {hasMultipleVideos && (
            <>
              <button
                type="button"
                onClick={handlePrevVideo}
                aria-label="Previous video"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/75 hover:bg-primary hover:text-black text-white border border-white/20 hover:border-primary flex items-center justify-center backdrop-blur-md shadow-lg transition-all duration-200 opacity-90 hover:opacity-100 hover:scale-110 active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleNextVideo}
                aria-label="Next video"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/75 hover:bg-primary hover:text-black text-white border border-white/20 hover:border-primary flex items-center justify-center backdrop-blur-md shadow-lg transition-all duration-200 opacity-90 hover:opacity-100 hover:scale-110 active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Bottom Title Bar */}
          <div className="absolute bottom-0 inset-x-0 p-3.5 z-10 space-y-1">
            <p className="text-xs font-bold text-white line-clamp-1 group-hover:text-primary transition-colors">
              {activeTitle}
            </p>
            <p className="text-[11px] text-white/70 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{t('eventDetails.watchVibe', 'Watch Concert Highlights & Lineup')}</span>
            </p>
          </div>
        </div>

        {/* Mini Video Thumbnails Strip (Like Image Gallery) */}
        {hasMultipleVideos && (
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none w-full">
            {displayVideos.map((vid, idx) => {
              const thumbPoster = getPosterUrl(vid);
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={vid.id || idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative w-14 h-16 rounded-lg overflow-hidden border shrink-0 transition-all duration-200 cursor-pointer bg-black/50 ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/40 scale-105 shadow-md opacity-100'
                      : 'border-border/60 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={thumbPoster}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center">
                      <Play className="w-2.5 h-2.5 fill-current ml-0.5 text-[#1B120F]" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Unified Luxury Video Modal Player */}
      <VideoModal
        isOpen={isOpenModal}
        onClose={handleCloseModal}
        videoUrl={activeVideo?.video_url}
        posterUrl={activePosterUrl}
        title={activeTitle}
      />
    </div>
  );
});

EventPromoVideo.displayName = 'EventPromoVideo';
