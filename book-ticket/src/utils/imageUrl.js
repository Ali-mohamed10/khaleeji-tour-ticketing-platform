/**
 * Derive the sibling 500px cover thumbnail URL uploaded alongside full covers.
 * Storage convention: cover_{ts}.webp → cover-thumb_{ts}.webp
 */
export function deriveSiblingThumbUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (!/\/cover_\d+\./.test(url)) return null;
  return url.replace(/\/cover_(\d+)\./, '/cover-thumb_$1.');
}

/**
 * Prefer stored thumbnail_url for the cover image only.
 * Does not guess sibling Storage paths (avoids 404 → retry on legacy covers).
 */
export function getCardImageSrc(event, imageUrl) {
  const src = imageUrl || event?.cover_image_url;
  if (!src) return '';

  if (
    event?.thumbnail_url &&
    (src === event.cover_image_url || !imageUrl)
  ) {
    return event.thumbnail_url;
  }

  return src;
}

/**
 * Full-size fallback when a thumb fails to load.
 */
export function getCardImageFallback(event, imageUrl) {
  return imageUrl || event?.cover_image_url || undefined;
}
