import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Loader2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { eventSchema } from '../../utils/eventSchema';
import { 
  useEvent, 
  useCreateEvent, 
  useUpdateEvent, 
  useUploadEventCover 
} from '../../hooks/useEvents';
import { 
  useCategories 
} from '../../hooks/useLookups';
import { useSeatMaps } from '../../hooks/useSeatMaps';

import { FormInput } from '../../components/ui/FormInput';
import { FormSelect } from '../../components/ui/FormSelect';
import { FormTextarea } from '../../components/ui/FormTextarea';
import { MultiImageUpload } from '../../components/ui/MultiImageUpload';
import { deriveSiblingThumbUrl } from '../../utils/imageUrl';

export const EventFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const isEditing = !!id;

  // Data Fetching
  const { data: event, isLoading: isLoadingEvent } = useEvent(id);
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { data: seatMaps, isLoading: isLoadingSeatMaps } = useSeatMaps();

  // Mutations
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const uploadMutation = useUploadEventCover();

  // Form Setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      status: 'draft',
      currency: 'CAD',
      starting_price: 0,
      images: [],
    }
  });

  const watchStatus = watch('status');
  const watchTitleEn = watch('title_en');
  const watchCoverImage = watch('cover_image_url');
  const watchImages = watch('images') || [];

  // Debounce ref for localStorage saves
  const saveTimerRef = useRef(null);

  // Load draft from localStorage on mount (only for creating new events)
  useEffect(() => {
    if (!isEditing) {
      const savedDraft = localStorage.getItem('event_form_draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed && typeof parsed === 'object') {
            // Sanitize UUID fields to prevent legacy or corrupt drafts from breaking form validation
            const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
            if (parsed.seat_map_id && !uuidRegex.test(parsed.seat_map_id)) {
              delete parsed.seat_map_id;
            }
            if (parsed.category_id && !uuidRegex.test(parsed.category_id)) {
              delete parsed.category_id;
            }
            reset(parsed);
          }
        } catch (e) {
          console.error('Failed to parse draft from localStorage', e);
        }
      }
    }
  }, [isEditing, reset]);

  // Save form draft to localStorage via subscription (debounced)
  useEffect(() => {
    if (isEditing) return;

    const subscription = watch((values) => {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        localStorage.setItem('event_form_draft', JSON.stringify(values));
      }, 500);
    });

    return () => {
      clearTimeout(saveTimerRef.current);
      subscription.unsubscribe();
    };
  }, [watch, isEditing]);

  // Auto-generate slug from title if it's empty and we're not editing
  useEffect(() => {
    if (!isEditing && watchTitleEn) {
      const generatedSlug = watchTitleEn
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setValue('slug', generatedSlug, { shouldValidate: true });
    }
  }, [watchTitleEn, isEditing, setValue]);

  // Load existing event data
  useEffect(() => {
    if (event && isEditing) {
      // Set simple fields
      Object.keys(event).forEach(key => {
        if (key !== 'categories' && key !== 'seat_maps') {
          // Format dates directly for datetime-local input without timezone shifts
          if (['start_date', 'end_date'].includes(key) && event[key]) {
            const raw = String(event[key]).replace(' ', 'T');
            const dateStr = raw.slice(0, 16);
            setValue(key, dateStr);
          } else {
            setValue(key, event[key]);
          }
        }
      });

      // Ensure images array is initialized from event.images or fallback to cover_image_url
      if (event.images && Array.isArray(event.images) && event.images.length > 0) {
        setValue('images', event.images);
      } else if (event.cover_image_url) {
        setValue('images', [event.cover_image_url]);
      }
    }
  }, [event, isEditing, setValue]);

  const onSubmit = async (data) => {
    try {
      // Save exact literal date string directly without browser timezone conversion
      const formattedData = { ...data };
      ['start_date', 'end_date'].forEach(key => {
        if (formattedData[key]) {
          const raw = String(formattedData[key]).replace(' ', 'T');
          formattedData[key] = raw.length === 16 ? `${raw}:00+00` : (raw.endsWith('+00') || raw.endsWith('Z') ? raw : `${raw}+00`);
        } else {
          formattedData[key] = null;
        }
      });

      // Nullify empty optional references when in soon or draft mode
      if (!formattedData.seat_map_id) formattedData.seat_map_id = null;
      if (!formattedData.category_id) formattedData.category_id = null;
      if (!formattedData.country_en) formattedData.country_en = null;
      if (!formattedData.city_en) formattedData.city_en = null;
      if (!formattedData.venue_en) formattedData.venue_en = null;
      formattedData.starting_price = Number(formattedData.starting_price) || 0;

      if (isEditing) {
        await updateMutation.mutateAsync({ id, data: formattedData });
      } else {
        await createMutation.mutateAsync(formattedData);
        // Clear draft after successful creation
        localStorage.removeItem('event_form_draft');
      }
      
      navigate('/admin/events');
    } catch (err) {
      console.error('Failed to save event:', err);
      alert(err.message || t('admin.events.saveError', 'Failed to save event.'));
    }
  };

  if (isEditing && isLoadingEvent) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isLoadingData = isLoadingCategories || isLoadingSeatMaps;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <button 
          onClick={() => navigate('/admin/events')}
          className="p-2 hover:bg-secondary rounded-full transition-colors"
          title={t('admin.events.backToList', 'Back to List')}
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-sans text-primary">
            {isEditing 
              ? t('admin.events.editTitle', 'Edit Event') 
              : t('admin.events.createTitle', 'Create New Event')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isEditing ? event?.title_en : t('admin.events.createSubtitle', 'Fill in the details for the new event')}
          </p>
        </div>
      </div>

      {/* Soon Status Helper Notice */}
      {watchStatus === 'soon' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-400 text-sm flex items-center gap-3">
          <Sparkles className="w-5 h-5 shrink-0" />
          <span>
            {t(
              'admin.events.soonNotice',
              'Coming Soon Mode: Only Title and Cover Image are required. Dates, Venue, and Seat Map can be added later.'
            )}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-8">
        {/* Main Content Area */}
        <div className="grow space-y-8">
          
          {/* Basic Info Section */}
          <section className="bg-secondary/5 border border-border p-6 rounded-lg space-y-4">
            <h2 className="text-lg font-bold font-sans text-foreground border-b border-border/50 pb-2 mb-4">
              {t('admin.events.sectionBasic', 'Basic Information')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label={t('admin.events.titleEn', 'Title (English)') + ' *'}
                {...register('title_en')}
                error={errors.title_en?.message}
                placeholder="e.g. The Titan Edition Concert"
              />
              <FormInput
                label={t('admin.events.titleAr', 'Title (Arabic)')}
                {...register('title_ar')}
                error={errors.title_ar?.message}
                placeholder="مثال: حفل الطبعة العملاقة"
                dir="rtl"
              />
            </div>
            
            <FormInput
              label={t('admin.events.slug', 'URL Slug') + ' *'}
              {...register('slug')}
              error={errors.slug?.message}
              placeholder="e.g. the-titan-edition"
              helperText={t('admin.events.slugHelper', 'URL-friendly identifier for the event page')}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormTextarea
                label={t('admin.events.descEn', 'Description (English)')}
                {...register('description_en')}
                error={errors.description_en?.message}
                placeholder="Detailed event description in English..."
              />
              <FormTextarea
                label={t('admin.events.descAr', 'Description (Arabic)')}
                {...register('description_ar')}
                error={errors.description_ar?.message}
                placeholder="وصف الفعالية بالعربية..."
                dir="rtl"
              />
            </div>
          </section>

          {/* Location Section */}
          <section className="bg-secondary/5 border border-border p-6 rounded-lg space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-4">
              <h2 className="text-lg font-bold font-sans text-foreground">
                {t('admin.events.sectionLocation', 'Location & Category')}
              </h2>
              {watchStatus === 'soon' && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  {t('admin.events.optional', 'Optional')}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label={t('admin.events.countryEn', 'Country (English)') + (watchStatus === 'soon' ? '' : ' *')}
                {...register('country_en')}
                error={errors.country_en?.message}
                placeholder="e.g. Canada"
              />
              <FormInput
                label={t('admin.events.countryAr', 'Country (Arabic)')}
                {...register('country_ar')}
                error={errors.country_ar?.message}
                placeholder="مثال: كندا"
                dir="rtl"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label={t('admin.events.cityEn', 'City (English)') + (watchStatus === 'soon' ? '' : ' *')}
                {...register('city_en')}
                error={errors.city_en?.message}
                placeholder="e.g. Windsor"
              />
              <FormInput
                label={t('admin.events.cityAr', 'City (Arabic)')}
                {...register('city_ar')}
                error={errors.city_ar?.message}
                placeholder="مثال: ويندزر"
                dir="rtl"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label={t('admin.events.venueEn', 'Venue (English)') + (watchStatus === 'soon' ? '' : ' *')}
                {...register('venue_en')}
                error={errors.venue_en?.message}
                placeholder="e.g. NAI Restaurant Windsor"
              />
              <FormInput
                label={t('admin.events.venueAr', 'Venue (Arabic)')}
                {...register('venue_ar')}
                error={errors.venue_ar?.message}
                placeholder="مثال: مطعم ناي ويندزر"
                dir="rtl"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                label={t('admin.events.category', 'Category') + (watchStatus === 'soon' ? '' : ' *')}
                {...register('category_id')}
                error={errors.category_id?.message}
                disabled={isLoadingCategories}
              >
                <option value="">{t('admin.events.selectCategory', 'Select Category')}</option>
                {categories?.map(c => (
                  <option key={c.id} value={c.id}>{isArabic ? c.name_ar : c.name_en}</option>
                ))}
              </FormSelect>
            </div>
          </section>
          
          {/* Schedule Section */}
          <section className="bg-secondary/5 border border-border p-6 rounded-lg space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-4">
              <h2 className="text-lg font-bold font-sans text-foreground">
                {t('admin.events.sectionSchedule', 'Schedule')}
              </h2>
              {watchStatus === 'soon' && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  {t('admin.events.optional', 'Optional')}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                type="datetime-local"
                label={t('admin.events.startDate', 'Start Date & Time') + (watchStatus === 'soon' ? '' : ' *')}
                {...register('start_date')}
                error={errors.start_date?.message}
              />
              <FormInput
                type="datetime-local"
                label={t('admin.events.endDate', 'End Date & Time') + (watchStatus === 'soon' ? '' : ' *')}
                {...register('end_date')}
                error={errors.end_date?.message}
              />
            </div>
          </section>

          {/* Ticketing Section */}
          <section className="bg-secondary/5 border border-border p-6 rounded-lg space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-4">
              <h2 className="text-lg font-bold font-sans text-foreground">
                {t('admin.events.sectionTicketing', 'Ticketing & Seating')}
              </h2>
              {watchStatus === 'soon' && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  {t('admin.events.optional', 'Optional')}
                </span>
              )}
            </div>
            
            <FormSelect
              label={t('admin.events.seatMap', 'Seat Map') + (watchStatus === 'soon' ? '' : ' *')}
              {...register('seat_map_id')}
              error={errors.seat_map_id?.message}
              disabled={isLoadingSeatMaps}
            >
              <option value="">{t('admin.events.selectSeatMap', 'Select Seat Map')}</option>
              {seatMaps?.map(map => (
                <option key={map.id} value={map.id}>{map.name}</option>
              ))}
            </FormSelect>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                type="number"
                min="0"
                step="0.01"
                label={t('admin.events.startingPrice', 'Starting Price')}
                {...register('starting_price')}
                error={errors.starting_price?.message}
              />
              <FormInput
                label={t('admin.events.currency', 'Currency')}
                {...register('currency')}
                error={errors.currency?.message}
              />
            </div>
          </section>

        </div>

        {/* Sidebar Controls Area */}
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
          
          {/* Status Panel */}
          <div className="bg-background border border-border p-6 rounded-lg space-y-4 top-15 z-10">
            <h2 className="text-lg font-bold font-sans text-foreground border-b border-border/50 pb-2 mb-4">
              {t('admin.events.sectionPublishing', 'Publishing')}
            </h2>
            
            <FormSelect
              label={t('admin.events.status', 'Event Status')}
              {...register('status')}
              error={errors.status?.message}
            >
              <option value="draft">{t('admin.events.statusDraft', 'Draft')}</option>
              <option value="published">{t('admin.events.statusPublished', 'Published')}</option>
              <option value="soon">{t('admin.events.statusSoon', 'Soon / Coming Soon')}</option>
              <option value="cancelled">{t('admin.events.statusCancelled', 'Cancelled')}</option>
              <option value="completed">{t('admin.events.statusCompleted', 'Completed')}</option>
            </FormSelect>

            <button
              type="submit"
              disabled={isSubmitting || isLoadingData}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 py-3 rounded-md font-bold transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {isEditing 
                ? t('admin.events.saveChanges', 'Save Changes') 
                : t('admin.events.createEvent', 'Create Event')}
            </button>
          </div>
          
          {/* Cover & Gallery Media Panel */}
          <div className="bg-secondary/5 border border-border p-6 rounded-lg space-y-4">
            <h2 className="text-lg font-bold font-sans text-foreground border-b border-border/50 pb-2 mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              {t('admin.events.sectionMedia', 'Media & Gallery')}
            </h2>
            
            <MultiImageUpload
              label={t('admin.events.eventImages', 'Event Images & Cover')}
              images={watchImages}
              coverImageUrl={watchCoverImage}
              onChangeImages={(newImages) => setValue('images', newImages, { shouldValidate: true })}
              onChangeCoverImage={(newCover) => {
                setValue('cover_image_url', newCover, { shouldValidate: true });
                setValue(
                  'thumbnail_url',
                  deriveSiblingThumbUrl(newCover) || '',
                  { shouldValidate: false }
                );
              }}
              onUploadSingle={async (file) => {
                const result = await uploadMutation.mutateAsync(file);
                if (result?.thumbnailUrl && result?.publicUrl) {
                  // Prefer exact uploaded thumb when this file becomes / is the cover
                  const currentCover = watch('cover_image_url');
                  if (!currentCover || currentCover === result.publicUrl) {
                    setValue('thumbnail_url', result.thumbnailUrl, { shouldValidate: false });
                  }
                }
                return result;
              }}
              isUploading={uploadMutation.isPending}
              error={errors.cover_image_url?.message || errors.images?.message}
            />
          </div>

          {/* SEO Panel */}
          <div className="bg-secondary/5 border border-border p-6 rounded-lg space-y-4">
            <h2 className="text-lg font-bold font-sans text-foreground border-b border-border/50 pb-2 mb-4">
              {t('admin.events.sectionSeo', 'SEO')}
            </h2>
            
            <FormInput
              label={t('admin.events.seoTitle', 'SEO Title')}
              {...register('seo_title')}
              error={errors.seo_title?.message}
            />
            
            <FormTextarea
              label={t('admin.events.seoDesc', 'SEO Description')}
              {...register('seo_description')}
              error={errors.seo_description?.message}
              className="min-h-20"
            />
          </div>

        </div>
      </form>
    </div>
  );
};

export default EventFormPage;
