/**
 * AdminVideoManager Component
 *
 * Purpose: Allows admins to upload, manage, toggle, and preview promo videos
 *          and teaser reels for any event directly from the dashboard.
 * Features:
 *   - Video drag & drop upload
 *   - Auto WebP poster thumbnail generation in browser
 *   - Link video to specific event or global tour
 *   - Placement control (Event Page, Home Reels, How It Works)
 *   - Active/Inactive toggle and delete operations
 */
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Film,
  Upload,
  Play,
  Trash2,
  CheckCircle2,
  Loader2,
  Sparkles,
  Calendar,
  Eye,
  EyeOff,
  Video,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { useEvents } from '../../hooks/useEvents';
import {
  useAdminVideos,
  useUploadVideo,
  useUploadPoster,
  useCreateVideo,
  useDeleteVideo,
  useToggleVideoStatus,
} from '../../hooks/useVideos';
import { formatVideoDuration, videoService } from '../../services/videoService';
import { VideoModal } from '../common/VideoModal';

export const AdminVideoManager = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { data: events = [] } = useEvents();
  const { data: videos = [], isLoading: isVideosLoading } = useAdminVideos();

  const uploadVideoMutation = useUploadVideo();
  const uploadPosterMutation = useUploadPoster();
  const createVideoMutation = useCreateVideo();
  const deleteVideoMutation = useDeleteVideo();
  const toggleStatusMutation = useToggleVideoStatus();

  // Form State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [selectedPosterFile, setSelectedPosterFile] = useState(null);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState(null);
  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [placement, setPlacement] = useState('event_details');
  const [aspectRatio] = useState('9:16');
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activePreviewVideo, setActivePreviewVideo] = useState(null);

  const fileInputRef = useRef(null);
  const posterInputRef = useRef(null);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      alert(isAr ? 'يرجى اختيار ملف فيديو صالح (.mp4, .webm, .mov)' : 'Please select a valid video file (.mp4, .webm, .mov)');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert(isAr ? 'حجم الفيديو كبير جداً (الحد الأقصى 50 ميجابايت)' : 'Video file too large (Max 50MB)');
      return;
    }

    setSelectedFile(file);
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
    }
    setPreviewObjectUrl(URL.createObjectURL(file));

    // Dynamically extract real video duration from browser metadata
    videoService.getVideoMetadata(file).then((meta) => {
      if (meta.duration) {
        setVideoDuration(meta.duration);
      }
    });

    if (!titleEn) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitleEn(cleanName);
      setTitleAr(cleanName);
    }
  };

  const handlePosterSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert(isAr ? 'يرجى اختيار ملف صورة صالح (.webp, .jpg, .png)' : 'Please select a valid image file (.webp, .jpg, .png)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert(isAr ? 'حجم صورة البوستر كبير جداً (الحد الأقصى 10 ميجابايت)' : 'Poster file too large (Max 10MB)');
      return;
    }

    setSelectedPosterFile(file);
    if (posterPreviewUrl) {
      URL.revokeObjectURL(posterPreviewUrl);
    }
    setPosterPreviewUrl(URL.createObjectURL(file));
  };

  const handleClearPoster = (e) => {
    e?.stopPropagation();
    setSelectedPosterFile(null);
    if (posterPreviewUrl) URL.revokeObjectURL(posterPreviewUrl);
    setPosterPreviewUrl(null);
    if (posterInputRef.current) posterInputRef.current.value = '';
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // 1. Upload video
      const { videoUrl, posterUrl: autoPosterUrl } = await uploadVideoMutation.mutateAsync({
        file: selectedFile,
        eventId: selectedEventId || null,
      });

      // 2. Upload custom poster if selected, otherwise fallback to event cover or auto poster
      let finalPosterUrl = null;
      if (selectedPosterFile) {
        finalPosterUrl = await uploadPosterMutation.mutateAsync({
          file: selectedPosterFile,
          eventId: selectedEventId || null,
        });
      } else {
        const matchedEvent = events.find((evt) => evt.id === selectedEventId);
        finalPosterUrl = matchedEvent?.cover_image_url || autoPosterUrl;
      }

      // 3. Create database record with exact duration and size
      await createVideoMutation.mutateAsync({
        event_id: selectedEventId || null,
        title_en: titleEn.trim() || 'Tour Promo',
        title_ar: titleAr.trim() || titleEn.trim() || 'الإعلان الترويجي',
        video_url: videoUrl,
        thumbnail_url: finalPosterUrl,
        aspect_ratio: aspectRatio,
        placement: placement,
        file_size_bytes: selectedFile.size,
        duration_seconds: videoDuration || null,
        is_active: true,
        sort_order: videos.length + 1,
      });

      showNotification(isAr ? 'تم رفع الفيديو والبوستر وحفظهما بنجاح!' : 'Video and poster uploaded and saved successfully!');

      // Reset form
      setSelectedFile(null);
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
      setPreviewObjectUrl(null);
      setVideoDuration(0);
      handleClearPoster();
      setTitleEn('');
      setTitleAr('');
      setSelectedEventId('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Error uploading video:', err);
      alert(isAr ? 'حدث خطأ أثناء رفع الفيديو أو البوستر' : 'Error uploading video or poster');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(isAr ? `هل أنت متأكد من حذف الفيديو "${title}"؟` : `Are you sure you want to delete "${title}"?`)) {
      return;
    }
    try {
      await deleteVideoMutation.mutateAsync(id);
      showNotification(isAr ? 'تم حذف الفيديو بنجاح' : 'Video deleted successfully');
    } catch (err) {
      console.error('Error deleting video:', err);
    }
  };

  const handleToggle = async (video) => {
    try {
      await toggleStatusMutation.mutateAsync({
        id: video.id,
        currentStatus: video.is_active,
      });
      showNotification(
        video.is_active
          ? (isAr ? 'تم إخفاء الفيديو' : 'Video deactivated')
          : (isAr ? 'تم تفعيل الفيديو للجمهور' : 'Video activated for public')
      );
    } catch (err) {
      console.error('Error toggling video status:', err);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs space-y-6 p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-xs">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap mb-1.5 items-center gap-2">
              <h2 className="text-lg font-bold font-sans text-foreground">
                {t('admin.videos.title', 'Event Promo Videos & Teaser Reels')}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/30">
                <Sparkles className="w-2.5 h-2.5" />
                {t('admin.videos.badge', 'Video Showcase')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(
                'admin.videos.subtitle',
                'Upload and configure promo reels, event teasers, and video walkthroughs with auto-optimized WebP posters.'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-xl text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* 1. Upload Form Box */}
      <form onSubmit={handleUploadSubmit} className="p-4 sm:p-5 rounded-2xl bg-secondary/15 border border-border space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Upload className="w-4 h-4 text-primary" />
          <span>{t('admin.videos.uploadNew', 'Upload New Promo Video')}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* File Pickers: Video + Optional Custom Poster */}
          <div className="space-y-3">
            {/* Video Picker & Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-background/50 hover:bg-primary/5 min-h-[130px]"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                className="hidden"
              />
              {previewObjectUrl ? (
                <div className="space-y-2 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Video className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-foreground line-clamp-1">{selectedFile?.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {isAr ? 'اضغط للتغيير' : 'Click to replace'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Upload className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    {t('admin.videos.dropVideo', 'Click or drag video here to upload')}
                  </p>
                  <p className="text-[11px] text-muted-foreground">MP4, WebM, MOV (Max 50MB)</p>
                </div>
              )}
            </div>

            {/* Custom Poster Image Picker */}
            <div
              onClick={() => posterInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-amber-500/60 rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-background/50 hover:bg-amber-500/5 min-h-[100px] relative group"
            >
              <input
                ref={posterInputRef}
                type="file"
                accept="image/webp,image/jpeg,image/png"
                onChange={(e) => handlePosterSelect(e.target.files?.[0])}
                className="hidden"
              />
              {posterPreviewUrl ? (
                <div className="flex items-center gap-3 w-full justify-center">
                  <div className="relative w-12 h-14 rounded-lg overflow-hidden border border-border shadow-sm shrink-0">
                    <img
                      src={posterPreviewUrl}
                      alt="Poster Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleClearPoster}
                      className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-destructive transition-colors cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <div className="text-start space-y-0.5">
                    <p className="text-xs font-bold text-foreground line-clamp-1">{selectedPosterFile?.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {(selectedPosterFile.size / 1024).toFixed(1)} KB • {isAr ? 'اضغط للتغيير' : 'Click to replace'}
                    </p>
                    <span className="text-[10px] text-emerald-400 font-semibold">✓ {isAr ? 'تم اختيار البوستر المخصص' : 'Custom Poster Set'}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <ImageIcon className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    {t('admin.videos.customPoster', 'Upload Custom Video Poster (Image)')}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {t('admin.videos.posterHint', 'WebP, JPG, PNG (Optional - auto falls back to event cover)')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Controls */}
          <div className="space-y-3">
            {/* Title EN */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {t('admin.videos.titleEn', 'Title (English)')}
              </label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="e.g. The Titan Edition Teaser"
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Title AR */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {t('admin.videos.titleAr', 'Title (Arabic)')}
              </label>
              <input
                type="text"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                placeholder="مثال: الإعلان الرسمي لجولة تايتن"
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Event Association */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  {t('admin.videos.linkedEvent', 'Associated Event')}
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-2.5 py-2 text-xs text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="">{t('admin.videos.globalTour', 'Global Tour (All Events)')}</option>
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {isAr && evt.title_ar ? evt.title_ar : evt.title_en}
                    </option>
                  ))}
                </select>
              </div>

              {/* Placement */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  {t('admin.videos.placement', 'Display Location')}
                </label>
                <select
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-2.5 py-2 text-xs text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="event_details">{t('admin.videos.placeEventPage', 'Event Details Page')}</option>
                  {/* <option value="home_reel">{t('admin.videos.placeHome', 'Homepage Reels')}</option>
                  <option value="how_it_works">{t('admin.videos.placeHowItWorks', 'How It Works')}</option>
                  <option value="all">{t('admin.videos.placeAll', 'All Pages')}</option> */}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={!selectedFile || isUploading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('admin.videos.uploading', 'Uploading & Optimizing...')}</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>{t('admin.videos.submitBtn', 'Upload & Save Video')}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* 2. Existing Videos List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Film className="w-4 h-4 text-primary" />
          <span>
            {t('admin.videos.existingVideos', 'Existing Promo Videos')} ({videos.length})
          </span>
        </h3>

        {isVideosLoading ? (
          <div className="py-8 text-center text-muted-foreground text-xs">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
            <span>{t('common.loading', 'Loading videos...')}</span>
          </div>
        ) : videos.length === 0 ? (
          <div className="py-8 text-center bg-secondary/10 rounded-xl border border-dashed border-border text-muted-foreground text-xs">
            {t('admin.videos.noVideos', 'No promo videos uploaded yet.')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((vid) => (
              <div
                key={vid.id}
                className="bg-secondary/15 border border-border rounded-xl p-3 flex flex-col justify-between gap-3 relative group hover:border-primary/40 transition-all"
              >
                {/* Thumbnail & Play Overlay */}
                <div
                  onClick={() => setActivePreviewVideo(vid)}
                  className="relative aspect-16/9 bg-black/60 rounded-lg overflow-hidden cursor-pointer border border-border flex items-center justify-center"
                >
                  {vid.thumbnail_url || vid.events?.cover_image_url ? (
                    <img
                      src={vid.thumbnail_url || vid.events?.cover_image_url}
                      alt={vid.title_en}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        if (vid.events?.cover_image_url) e.currentTarget.src = vid.events.cover_image_url;
                      }}
                      className="w-full h-full object-contain opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all"
                    />
                  ) : (
                    <Film className="w-8 h-8 text-muted-foreground opacity-50" />
                  )}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 fill-current ml-0.5 text-[#1B120F]" />
                    </div>
                  </div>
                  {vid.duration_seconds ? (
                    <span className="absolute bottom-2 right-2 text-[10px] font-mono font-bold bg-black/70 px-1.5 py-0.5 rounded text-white">
                      {formatVideoDuration(vid.duration_seconds)}
                    </span>
                  ) : null}
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground line-clamp-1">
                    {isAr && vid.title_ar ? vid.title_ar : vid.title_en}
                  </h4>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-primary" />
                    <span>
                      {vid.events ? (isAr && vid.events.title_ar ? vid.events.title_ar : vid.events.title_en) : t('admin.videos.globalTour', 'Global Tour')}
                    </span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                  <button
                    type="button"
                    onClick={() => handleToggle(vid)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                      vid.is_active
                        ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {vid.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{vid.is_active ? t('common.active', 'Active') : t('common.hidden', 'Hidden')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(vid.id, vid.title_en)}
                    className="p-1.5 rounded-lg text-destructive hover:bg-destructive/15 transition-colors cursor-pointer"
                    title={t('common.delete', 'Delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Video Modal Preview */}
      <VideoModal
        isOpen={!!activePreviewVideo}
        onClose={() => setActivePreviewVideo(null)}
        videoUrl={activePreviewVideo?.video_url}
        posterUrl={activePreviewVideo?.thumbnail_url || activePreviewVideo?.events?.cover_image_url}
        title={isAr && activePreviewVideo?.title_ar ? activePreviewVideo.title_ar : activePreviewVideo?.title_en}
      />
    </div>
  );
};

export default AdminVideoManager;
