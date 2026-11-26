import { z } from 'zod';

export const eventSchema = z
  .object({
    title_en: z.string().min(3, { message: 'Title (EN) must be at least 3 characters' }),
    title_ar: z.string().optional(),
    slug: z
      .string()
      .min(3, { message: 'Slug must be at least 3 characters' })
      .regex(/^[a-z0-9-]+$/, {
        message: 'Slug can only contain lowercase letters, numbers, and hyphens',
      }),
    description_en: z.string().optional(),
    description_ar: z.string().optional(),

    country_en: z.string().optional(),
    country_ar: z.string().optional(),
    city_en: z.string().optional(),
    city_ar: z.string().optional(),
    venue_en: z.string().optional(),
    venue_ar: z.string().optional(),

    category_id: z.string().optional(),
    seat_map_id: z.string().optional(),

    start_date: z.string().optional(),
    end_date: z.string().optional(),

    starting_price: z.coerce.number().min(0, { message: 'Starting price cannot be negative' }).optional(),
    currency: z.string().default('CAD'),

    status: z.enum(['draft', 'published', 'soon', 'cancelled', 'completed']),
    seo_title: z.string().optional(),
    seo_description: z.string().optional(),
    cover_image_url: z.string().optional(),
    thumbnail_url: z.string().optional().nullable(),
    images: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    // When status is 'soon' (Coming Soon): Only Title and Cover Image are strictly required
    if (data.status === 'soon') {
      if (!data.cover_image_url || data.cover_image_url.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cover image is required for Coming Soon events',
          path: ['cover_image_url'],
        });
      }
      return;
    }

    // When status is 'published': All full event details must be complete
    if (data.status === 'published') {
      if (!data.country_en || data.country_en.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Country (EN) is required for published events',
          path: ['country_en'],
        });
      }
      if (!data.city_en || data.city_en.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'City (EN) is required for published events',
          path: ['city_en'],
        });
      }
      if (!data.venue_en || data.venue_en.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Venue (EN) is required for published events',
          path: ['venue_en'],
        });
      }
      if (!data.category_id || data.category_id.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Category is required for published events',
          path: ['category_id'],
        });
      }
      if (!data.seat_map_id || data.seat_map_id.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Seat map is required for published events',
          path: ['seat_map_id'],
        });
      }
      if (!data.start_date || isNaN(Date.parse(data.start_date))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Valid start date & time is required for published events',
          path: ['start_date'],
        });
      }
      if (!data.end_date || isNaN(Date.parse(data.end_date))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Valid end date & time is required for published events',
          path: ['end_date'],
        });
      }
      if (data.start_date && data.end_date && !isNaN(Date.parse(data.start_date)) && !isNaN(Date.parse(data.end_date))) {
        if (new Date(data.start_date) > new Date(data.end_date)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'End date cannot be before start date',
            path: ['end_date'],
          });
        }
      }
    }
  });
