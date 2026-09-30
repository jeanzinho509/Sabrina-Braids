export const MAX_PHOTOS = 8;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export function itemPhotos(item) {
  if (Array.isArray(item.image_urls) && item.image_urls.length)
    return item.image_urls;
  return item.image_url ? [item.image_url] : [];
}
