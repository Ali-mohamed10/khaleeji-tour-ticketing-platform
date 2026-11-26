/**
 * Video Service
 *
 * Provides APIs for fetching, uploading, compressing, and managing
 * event promo videos and reels.
 */
import { supabase } from '../lib/supabaseClient';

export interface EventVideo {
  id: string;
  event_id?: string | null;
  title_en: string;
  title_ar: string;
  description_en?: string | null;
  description_ar?: string | null;
  video_url: string;
  thumbnail_url?: string | null;
  aspect_ratio: '9:16' | '16:9';
  placement: 'event_details' | 'home_reel' | 'how_it_works' | 'all';
  sort_order: number;
  is_active: boolean;
  duration_seconds?: number | null;
  file_size_bytes?: number | null;
  created_at?: string;
  updated_at?: string;
  events?: {
    id?: string;
    title_en?: string;
    title_ar?: string;
    slug?: string;
    cover_image_url?: string | null;
  } | null;
}

export const formatVideoDuration = (seconds?: number | null): string => {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const videoService = {
  /**
   * Fetch active videos for a specific event
   */
  async getVideosByEventId(eventId: string): Promise<EventVideo[]> {
    if (!eventId) return [];

    const { data, error } = await supabase
      .from('event_videos')
      .select('*, events(id, title_en, title_ar, slug, cover_image_url)')
      .eq('event_id', eventId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching event videos:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Fetch active videos by placement (e.g. 'home_reel', 'how_it_works')
   */
  async getVideosByPlacement(placement: string): Promise<EventVideo[]> {
    const { data, error } = await supabase
      .from('event_videos')
      .select('*, events(id, title_en, title_ar, slug, cover_image_url)')
      .or(`placement.eq.${placement},placement.eq.all`)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching videos by placement:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Fetch all videos for Admin management
   */
  async getAllVideosForAdmin(): Promise<EventVideo[]> {
    const { data, error } = await supabase
      .from('event_videos')
      .select('*, events(id, title_en, title_ar, slug, cover_image_url)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin videos:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Extract high quality WebP poster thumbnail from a video file in browser
   */
  async generateVideoPosterBlob(videoFile: File, seekTime = 1.0): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      const objectUrl = URL.createObjectURL(videoFile);
      video.src = objectUrl;

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(seekTime, (video.duration || 2) / 2);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 720;
          canvas.height = video.videoHeight || 1280;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(objectUrl);
            return reject(new Error('Canvas context unavailable'));
          }

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(objectUrl);
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to generate poster blob'));
              }
            },
            'image/webp',
            0.85
          );
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          reject(err);
        }
      };

      video.onerror = (e) => {
        URL.revokeObjectURL(objectUrl);
        reject(e);
      };
    });
  },

  /**
   * Extract video duration and dimensions from file in browser
   */
  async getVideoMetadata(file: File): Promise<{ duration: number; width: number; height: number }> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;

      video.onloadedmetadata = () => {
        const duration = Math.round(video.duration) || 0;
        const width = video.videoWidth || 0;
        const height = video.videoHeight || 0;
        URL.revokeObjectURL(objectUrl);
        resolve({ duration, width, height });
      };

      video.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ duration: 0, width: 0, height: 0 });
      };
    });
  },

  /**
   * Upload video and auto-generated poster to Supabase Storage
   */
  async uploadVideo(file: File, eventId?: string | null): Promise<{ videoUrl: string; posterUrl: string | null }> {
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const videoPath = `videos/${eventId || 'global'}_${timestamp}_${cleanFileName}`;

    // 1. Upload Video
    const { error: videoErr } = await supabase.storage
      .from('event-videos')
      .upload(videoPath, file, {
        cacheControl: '31536000',
        upsert: true,
      });

    if (videoErr) {
      console.error('Error uploading video:', videoErr);
      throw videoErr;
    }

    const { data: videoData } = supabase.storage.from('event-videos').getPublicUrl(videoPath);
    const videoUrl = videoData.publicUrl;

    // 2. Generate and upload WebP Poster Thumbnail
    let posterUrl: string | null = null;
    try {
      const posterBlob = await this.generateVideoPosterBlob(file);
      const posterPath = `posters/${eventId || 'global'}_${timestamp}_poster.webp`;
      const { error: posterErr } = await supabase.storage
        .from('event-videos')
        .upload(posterPath, posterBlob, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: true,
        });

      if (!posterErr) {
        const { data: posterData } = supabase.storage.from('event-videos').getPublicUrl(posterPath);
        posterUrl = posterData.publicUrl;
      }
    } catch (posterErr) {
      console.warn('Could not auto-generate video poster, proceeding without it:', posterErr);
    }

    return { videoUrl, posterUrl };
  },

  /**
   * Upload custom poster image file to Supabase Storage
   */
  async uploadPosterImage(file: File, eventId?: string | null): Promise<string> {
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const posterPath = `posters/${eventId || 'global'}_${timestamp}_${cleanFileName}`;

    const { error } = await supabase.storage
      .from('event-videos')
      .upload(posterPath, file, {
        cacheControl: '31536000',
        upsert: true,
      });

    if (error) {
      console.error('Error uploading poster image:', error);
      throw error;
    }

    const { data } = supabase.storage.from('event-videos').getPublicUrl(posterPath);
    return data.publicUrl;
  },

  /**
   * Create video database record
   */
  async createVideo(params: Partial<EventVideo>): Promise<EventVideo> {
    const { data, error } = await supabase
      .from('event_videos')
      .insert({
        event_id: params.event_id || null,
        title_en: params.title_en || 'Tour Promo',
        title_ar: params.title_ar || 'الإعلان الترويجي',
        description_en: params.description_en || null,
        description_ar: params.description_ar || null,
        video_url: params.video_url,
        thumbnail_url: params.thumbnail_url || null,
        aspect_ratio: params.aspect_ratio || '9:16',
        placement: params.placement || 'event_details',
        sort_order: params.sort_order || 0,
        is_active: params.is_active !== undefined ? params.is_active : true,
        duration_seconds: params.duration_seconds || 70,
        file_size_bytes: params.file_size_bytes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating video record:', error);
      throw error;
    }

    return data;
  },

  /**
   * Update video record
   */
  async updateVideo(id: string, updates: Partial<EventVideo>): Promise<EventVideo> {
    const { data, error } = await supabase
      .from('event_videos')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating video:', error);
      throw error;
    }

    return data;
  },

  /**
   * Delete video record
   */
  async deleteVideo(id: string): Promise<void> {
    const { error } = await supabase.from('event_videos').delete().eq('id', id);
    if (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  },

  /**
   * Toggle active state
   */
  async toggleVideoStatus(id: string, currentStatus: boolean): Promise<EventVideo> {
    return this.updateVideo(id, { is_active: !currentStatus });
  },
};

export default videoService;
