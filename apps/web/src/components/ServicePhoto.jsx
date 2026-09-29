import { useState } from "react";
import { isDemoImage, serviceImage } from "@/utils/demoCatalog";

export default function ServicePhoto({
  service,
  className = "",
  admin = false,
}) {
  const src = serviceImage(service);
  const [failedSrc, setFailedSrc] = useState(null);
  return (
    <div className={`relative overflow-hidden bg-[#f0e6da] ${className}`}>
      {src && src !== failedSrc ? (
        <>
          <img
            src={src}
            alt={`${service.name}${isDemoImage(src) ? " — imagem ilustrativa" : ""}`}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setFailedSrc(src)}
          />
          {isDemoImage(src) && (
            <span className="absolute bottom-2 left-2 rounded bg-white/95 px-2 py-1 text-xs text-[#5c4737]">
              Imagem ilustrativa
            </span>
          )}
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-sm text-[#725744]">
          <span>{src ? "Foto indisponível" : "Foto em breve"}</span>
          {admin && (
            <span className="text-xs">Use Editar para enviar uma foto.</span>
          )}
        </div>
      )}
    </div>
  );
}
