import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { isDemoImage } from "@/utils/demoCatalog";

export default function PhotoGallery({
  photos,
  name,
  className = "",
  contain = false,
  interactive = true,
}) {
  const [position, setPosition] = useState(0);
  const [failed, setFailed] = useState([]);
  const index = Math.min(position, Math.max(0, photos.length - 1));
  const src = photos[index];
  function move(event, delta) {
    event.preventDefault();
    event.stopPropagation();
    setPosition((index + delta + photos.length) % photos.length);
  }
  return (
    <div
      className={`relative overflow-hidden bg-[#f0f1e7] ${className}`}
      role={interactive && photos.length > 1 ? "group" : undefined}
      aria-label={
        interactive && photos.length > 1 ? `Fotos de ${name}` : undefined
      }
    >
      {src && !failed.includes(src) ? (
        <img
          src={src}
          alt={`${name}${photos.length > 1 ? ` — foto ${index + 1} de ${photos.length}` : ""}${isDemoImage(src) ? " — imagem ilustrativa" : ""}`}
          loading="lazy"
          className={`h-full w-full ${contain ? "object-contain p-4" : "object-cover"}`}
          onError={() => setFailed((previous) => [...previous, src])}
        />
      ) : (
        <div className="flex h-full min-h-24 items-center justify-center p-4 text-sm text-[#5b6247]">
          {src ? "Foto indisponível" : "Foto em breve"}
        </div>
      )}
      {isDemoImage(src) && (
        <span className="absolute bottom-2 left-2 rounded bg-white/95 px-2 py-1 text-xs text-[#5c4737]">
          Imagem ilustrativa
        </span>
      )}
      {photos.length > 1 && (
        <>
          <span
            aria-live="polite"
            aria-atomic="true"
            className="absolute right-2 top-2 rounded-full bg-[#29321f]/90 px-3 py-1 text-xs text-white"
          >
            {index + 1} / {photos.length}
          </span>
          {interactive && (
            <>
              <button
                type="button"
                onClick={(event) => move(event, -1)}
                aria-label={`Foto anterior de ${name}`}
                className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#29321f] shadow hover:bg-white"
              >
                <ChevronLeft aria-hidden="true" size={20} />
              </button>
              <button
                type="button"
                onClick={(event) => move(event, 1)}
                aria-label={`Próxima foto de ${name}`}
                className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#29321f] shadow hover:bg-white"
              >
                <ChevronRight aria-hidden="true" size={20} />
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
