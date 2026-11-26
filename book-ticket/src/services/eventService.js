import { supabase } from '../lib/supabaseClient';

/** Columns needed for public homepage / event cards (no descriptions or seat maps). */
const PUBLIC_EVENT_LIST_COLUMNS =
  'id, slug, status, title_en, title_ar, venue_en, venue_ar, start_date, end_date, starting_price, cover_image_url, thumbnail_url, images, currency';

/**
 * Standalone helper to ensure slug is unique and doesn't violate unique constraint in Supabase
 */
const ensureUniqueSlug = async (baseSlug, excludeId = null) => {
  let cleanSlug = (baseSlug || 'event')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  if (!cleanSlug) cleanSlug = 'event';

  let uniqueSlug = cleanSlug;
  let counter = 1;

  while (true) {
    let query = supabase.from('events').select('id').eq('slug', uniqueSlug);
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) {
      return uniqueSlug;
    }

    counter += 1;
    uniqueSlug = `${cleanSlug}-${counter}`;
  }
};

export const eventService = {
  ensureUniqueSlug,

  // Fetch all events (admin / full list)
  async getEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*, categories(name_en, name_ar, slug, icon), seat_maps(name, slug)')
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Lean public list: published + soon only, card fields only
  async getPublicEvents() {
    const { data, error } = await supabase
      .from('events')
      .select(PUBLIC_EVENT_LIST_COLUMNS)
      .in('status', ['published', 'soon'])
      .order('start_date', { ascending: true, nullsFirst: false });

    if (error) throw error;
    return data;
  },

  // Fetch single event by id
  async getEventById(id) {
    const { data, error } = await supabase
      .from('events')
      .select('*, categories(*), seat_maps(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Fetch single event by slug (includes seat map with tables for public page)
  async getEventBySlug(slug) {
    const { data, error } = await supabase
      .from('events')
      .select('*, categories(*), seat_maps(*, tables(*))')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new event
  async createEvent(eventData) {
    const rawSlug = eventData.slug || eventData.title_en || 'event';
    const uniqueSlug = await ensureUniqueSlug(rawSlug);
    const payload = { ...eventData, slug: uniqueSlug };

    const { data, error } = await supabase
      .from('events')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update existing event
  async updateEvent(id, updates) {
    const payload = { ...updates };
    if (payload.slug) {
      payload.slug = await ensureUniqueSlug(payload.slug, id);
    }

    const { data, error } = await supabase
      .from('events')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete event
  async deleteEvent(id) {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Duplicate event
  async duplicateEvent(id) {
    // Fetch the event to duplicate
    const originalEvent = await eventService.getEventById(id);
    if (!originalEvent) throw new Error('Event not found');

    // Create a new payload based on the original event
    const newEventData = {
      ...originalEvent,
      id: undefined, // Let Supabase generate a new UUID
      created_at: undefined,
      updated_at: undefined,
      venues: undefined, // Remove joined data
      categories: undefined,
      seat_maps: undefined,
      title_en: `${originalEvent.title_en} (Copy)`,
      slug: await ensureUniqueSlug(`${originalEvent.slug}-copy`),
      status: 'draft', // Duplicates should start as draft
    };
    
    // Explicitly delete undefined fields
    Object.keys(newEventData).forEach(key => newEventData[key] === undefined && delete newEventData[key]);

    const { data, error } = await supabase
      .from('events')
      .insert([newEventData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Upload cover image (dynamic import keeps compression off public list path)
  async uploadCoverImage(file, eventId, onProgress) {
    const { uploadEventCover } = await import('./imageUpload');
    const result = await uploadEventCover(file, eventId, onProgress);
    return {
      publicUrl: result.publicUrl,
      thumbnailUrl: result.thumbnailUrl || null,
    };
  },
};
