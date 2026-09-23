export function validImage(value) {
  if (typeof value !== "string") return false;
  if (/^https:\/\//i.test(value)) {
    try {
      return Boolean(new URL(value).hostname);
    } catch {
      return false;
    }
  }
  if (value.length > 2800000) return false;
  return /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(value);
}

export function validVideo(value) {
  try {
    return typeof value === "string" && new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
