import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, Star, Plus } from 'lucide-react';
import AppImage from '../common/AppImage';
import { validateImage } from '../../services/imageUpload';

export const MultiImageUpload = ({
  label,
  images = [],
  coverImageUrl = '',
  onChangeImages,
  onChangeCoverImage,
  onUploadSingle,
  isUploading = false,
  accept = 'image/jpeg, image/png, image/webp',
  error,
}) => {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState('');
  const [uploadingCount, setUploadingCount] = useState(0);
  const inputRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const processFiles = useCallback(
    async (fileList) => {
      setLocalError('');
      const files = Array.from(fileList);
      if (files.length === 0) return;

      setUploadingCount(files.length);
      const newUploadedUrls = [];

      try {
        for (const file of files) {
          try {
            validateImage(file);
            if (onUploadSingle) {
              const result = await onUploadSingle(file);
              const url = typeof result === 'string' ? result : result?.publicUrl;
              if (url) {
                newUploadedUrls.push(url);
              }
            }
          } catch (err) {
            console.error('Failed to upload file:', file.name, err);
            setLocalError(err.message || 'Failed to upload one or more images');
          }
        }

        if (newUploadedUrls.length > 0) {
          const currentList = Array.isArray(images) ? [...images] : [];
          // Also include existing coverImageUrl if not in images
          if (coverImageUrl && !currentList.includes(coverImageUrl)) {
            currentList.unshift(coverImageUrl);
          }

          const combined = [...currentList, ...newUploadedUrls];
          // Remove duplicates
          const uniqueImages = Array.from(new Set(combined));

          onChangeImages(uniqueImages);

          // If no cover image set yet, set the first uploaded one
          if (!coverImageUrl || coverImageUrl.trim() === '') {
            onChangeCoverImage(uniqueImages[0]);
          }
        }
      } finally {
        setUploadingCount(0);
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }
    },
    [images, coverImageUrl, onUploadSingle, onChangeImages, onChangeCoverImage]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleChange = useCallback(
    (e) => {
      e.preventDefault();
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
      }
    },
    [processFiles]
  );

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const handleSetCover = (url) => {
    onChangeCoverImage(url);
    // Ensure cover image is at index 0 of the images list
    const currentList = Array.isArray(images) ? [...images] : [];
    if (!currentList.includes(url)) {
      currentList.unshift(url);
    } else {
      const filtered = currentList.filter((u) => u !== url);
      filtered.unshift(url);
      onChangeImages(filtered);
    }
  };

  const handleRemoveImage = (urlToRemove) => {
    const currentList = Array.isArray(images) ? [...images] : [];
    const filtered = currentList.filter((u) => u !== urlToRemove);
    onChangeImages(filtered);

    // If we removed the cover image, pick the new first image as cover
    if (coverImageUrl === urlToRemove) {
      onChangeCoverImage(filtered.length > 0 ? filtered[0] : '');
    }
  };

  // Compile full list of images ensuring cover is always included
  const allImages = Array.from(
    new Set([
      ...(coverImageUrl ? [coverImageUrl] : []),
      ...(Array.isArray(images) ? images : []),
    ])
  ).filter(Boolean);

  const displayError = error || localError;

  return (
    <div className="flex flex-col gap-3 w-full">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">{label}</label>
          <span className="text-xs text-muted-foreground font-mono">
            {allImages.length} {allImages.length === 1 ? 'image' : 'images'}
          </span>
        </div>
      )}

      {/* Grid of uploaded images */}
      {allImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {allImages.map((imgUrl, idx) => {
            const isCover = imgUrl === coverImageUrl || (idx === 0 && !coverImageUrl);
            return (
              <div
                key={imgUrl}
                className={`relative group rounded-xl overflow-hidden border aspect-4/5 bg-background shadow-xs transition-all duration-200 ${
                  isCover
                    ? 'border-primary ring-2 ring-primary/30 shadow-[0_0_15px_rgba(201,169,107,0.25)]'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <AppImage
                  src={imgUrl}
                  alt={`Event image ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  containerClassName="w-full h-full"
                />

                {/* Primary Cover Badge */}
                {isCover && (
                  <div className="absolute bottom-2 left-2 z-10 bg-primary text-primary-foreground text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md shadow-md flex items-center gap-1 tracking-wider">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{t('admin.events.coverBadge', 'Cover')}</span>
                  </div>
                )}

                {/* Hover overlay actions */}
                <div className="absolute inset-0 bg-black/60 transition-opacity flex flex-col justify-between p-2 z-20">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(imgUrl)}
                      className="p-1.5 bg-destructive/90 text-destructive-foreground rounded-lg hover:bg-destructive transition-colors shadow-md"
                      title={t('common.delete', 'Delete image')}
                      aria-label="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {!isCover && (
                    <button
                      type="button"
                      onClick={() => handleSetCover(imgUrl)}
                      className="w-full py-1.5 px-2 bg-primary/90 hover:bg-primary text-primary-foreground rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <span>{t('admin.events.makeCover', 'Set as Cover')}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Dropzone */}
      <div
        className={`
          relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl transition-all
          ${dragActive ? 'border-primary bg-primary/10 scale-[1.01]' : 'border-border bg-secondary/5 hover:bg-secondary/15 hover:border-primary/50'}
          ${displayError ? 'border-destructive/50 hover:border-destructive' : ''}
          ${isUploading || uploadingCount > 0 ? 'opacity-75 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleChange}
          className="hidden"
          disabled={isUploading || uploadingCount > 0}
        />

        {isUploading || uploadingCount > 0 ? (
          <div className="flex flex-col items-center gap-2.5 text-primary py-3 text-center">
            <Loader2 className="w-7 h-7 animate-spin" />
            <span className="text-xs font-semibold">
              {t('admin.events.uploadingMultiple', 'Compressing & uploading images...')}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center py-2">
            <div className="p-2.5 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <Plus className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">
                {allImages.length > 0
                  ? t('admin.events.addMoreImages', '+ Add more images')
                  : t('admin.events.uploadImagesPrompt', 'Click or drag images here')}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t('admin.events.imageFormatsHint', 'JPEG, PNG, WebP (multi-select supported)')}
              </p>
            </div>
          </div>
        )}
      </div>

      {displayError && (
        <span className="text-xs text-destructive mt-0.5">{displayError}</span>
      )}
    </div>
  );
};

export default MultiImageUpload;
