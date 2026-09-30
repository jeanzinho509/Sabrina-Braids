import { isDemoImage } from "../../../utils/demoCatalog.js";
import {
  MAX_IMAGE_BYTES,
  MAX_PHOTOS,
  itemPhotos,
} from "../../../utils/photos.js";
export const mediaPath =
  /^\/api\/media\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function decodeImage(value) {
  if (typeof value !== "string" || value.length > 2800000) return null;
  const match =
    /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(
      value,
    );
  if (!match) return null;
  const bytes = Buffer.from(match[2], "base64");
  if (
    !bytes.length ||
    bytes.length > MAX_IMAGE_BYTES ||
    bytes.toString("base64") !== match[2]
  )
    return null;
  const valid =
    match[1] === "image/png"
      ? bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : match[1] === "image/jpeg"
        ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : bytes.toString("ascii", 0, 4) === "RIFF" &&
          bytes.toString("ascii", 8, 12) === "WEBP";
  return valid ? { mimeType: match[1], base64: match[2], bytes } : null;
}

export function validImage(value) {
  if (typeof value !== "string") return false;
  if (isDemoImage(value) || mediaPath.test(value)) return true;
  if (/^https:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      return (
        value.length <= 2048 &&
        Boolean(url.hostname) &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }
  return Boolean(decodeImage(value));
}

export function validatePhotos(input, existing = {}) {
  let photos = itemPhotos(existing);
  if (Object.hasOwn(input, "image_urls")) photos = input.image_urls;
  else if (Object.hasOwn(input, "image_url"))
    photos = input.image_url ? [input.image_url, ...photos.slice(1)] : [];
  if (
    !Array.isArray(photos) ||
    photos.length > MAX_PHOTOS ||
    photos.some((url) => !validImage(url))
  )
    return {
      error:
        "Use até 8 fotos válidas: JPG, PNG ou WebP de até 2 MB, ou links HTTPS.",
    };
  return { image_urls: [...new Set(photos)], image_url: photos[0] || null };
}

export function validVideo(value) {
  try {
    return typeof value === "string" && new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
