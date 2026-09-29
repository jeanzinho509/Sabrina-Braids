// Exact demo names only: never substitute an invented photo for a real service.
export const demoImages = {
  "Box Braids · demonstração": "/images/demo/box-braids.png",
  "Knotless Braids · demonstração": "/images/demo/knotless-braids.png",
  "Twists · demonstração": "/images/demo/twists.png",
};

export function isDemoImage(url) {
  return Object.values(demoImages).includes(url);
}

export function serviceImage(service) {
  return service.image_url || demoImages[service.name] || "";
}
