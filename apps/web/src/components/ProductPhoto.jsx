import { useState } from "react";
import { ShoppingBag } from "lucide-react";

export default function ProductPhoto({ product, className = "" }) {
  const [failedSrc, setFailedSrc] = useState(null);
  return (
    <div
      className={`flex items-center justify-center overflow-hidden bg-[#faf7f2] ${className}`}
    >
      {product.image_url && product.image_url !== failedSrc ? (
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-contain p-4"
          onError={() => setFailedSrc(product.image_url)}
        />
      ) : (
        <div className="flex flex-col items-center gap-3 p-5 text-sm text-[#725744]">
          <ShoppingBag aria-hidden="true" className="h-8 w-8" />
          <span>
            {product.image_url ? "Foto indisponível" : "Adicione uma foto"}
          </span>
        </div>
      )}
    </div>
  );
}
