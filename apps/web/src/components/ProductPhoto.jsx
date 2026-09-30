import PhotoGallery from "./PhotoGallery";
import { itemPhotos } from "@/utils/photos";

export default function ProductPhoto({ product, className = "" }) {
  return (
    <PhotoGallery
      photos={itemPhotos(product)}
      name={product.name}
      className={className}
      contain
    />
  );
}
