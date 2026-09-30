import PhotoGallery from "./PhotoGallery";
import { serviceImage } from "@/utils/demoCatalog";
import { itemPhotos } from "@/utils/photos";

export default function ServicePhoto({
  service,
  className = "",
  interactive = true,
}) {
  const photos = itemPhotos(service);
  if (!photos.length && serviceImage(service))
    photos.push(serviceImage(service));
  return (
    <PhotoGallery
      photos={photos}
      name={service.name}
      className={className}
      interactive={interactive}
    />
  );
}
