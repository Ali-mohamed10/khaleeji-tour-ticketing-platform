/**
 * VideoModal Component
 *
 * Purpose: Unified, luxury full-screen video popup player.
 * Features:
 *   - Renders directly in document.body via createPortal
 *   - Auto body-scroll locking with scrollbar layout-shift compensation
 *   - Keyboard support (Escape key to close)
 *   - Touch & mobile friendly with overscroll prevention
 *   - Top bar with dynamic title and close button
 *   - Native luxury controls (play/pause, timeline, volume, fullscreen)
 */
import { useEffect, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const VideoModal = memo(({
  isOpen,
  onClose,
  videoUrl,
  posterUrl,
  title = '',
}) => {
  const videoRef = useRef(null);

  // Lock background body scroll when video modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !videoUrl || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in touch-none overscroll-contain"
      onClick={onClose}
    >
      {/* Modal Box */}
      <div
        className="relative w-full max-w-sm sm:max-w-md aspect-9/16 max-h-[88vh] bg-[#18110D] border border-primary/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-auto">
          <div className="flex items-center gap-2 pr-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-white line-clamp-1 drop-shadow-md">
              {title}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 shrink-0"
            aria-label="Close video player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Player */}
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl}
          autoPlay
          controls
          playsInline
          className="w-full h-full object-contain bg-black"
        />
      </div>
    </div>,
    document.body
  );
});

VideoModal.displayName = 'VideoModal';
export default VideoModal;
