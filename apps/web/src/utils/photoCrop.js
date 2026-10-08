export const MAX_CROP_BYTES = 2 * 1024 * 1024;
const MAX_EDGE = 1920;

export function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

// Coordinates are always in decoded image pixels, shared by preview and export.
export function cropRectangle(
  width,
  height,
  aspect,
  zoom = 1,
  position = { x: 0.5, y: 0.5 },
) {
  if (
    ![width, height, aspect].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  ) {
    throw new Error("A imagem não tem dimensões válidas.");
  }
  const cropWidth = Math.min(width, height * aspect) / clamp(zoom, 1, 3);
  const cropHeight = cropWidth / aspect;
  return {
    x: Math.max(0, width - cropWidth) * clamp(position.x),
    y: Math.max(0, height - cropHeight) * clamp(position.y),
    width: cropWidth,
    height: cropHeight,
  };
}

export function moveCrop(image, crop, dx, dy) {
  const rangeX = image.width - crop.width;
  const rangeY = image.height - crop.height;
  return {
    x: rangeX > 0 ? clamp((crop.x - dx) / rangeX) : 0.5,
    y: rangeY > 0 ? clamp((crop.y - dy) / rangeY) : 0.5,
  };
}

export async function exportCrop(image, crop) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context)
    throw new Error("Não foi possível preparar o recorte neste navegador.");
  let scale = Math.min(1, MAX_EDGE / Math.max(crop.width, crop.height));
  try {
    // Bounded resizing also covers browsers that fall back from WebP to PNG.
    for (let attempt = 0; attempt < 5; attempt++) {
      canvas.width = Math.max(1, Math.round(crop.width * scale));
      canvas.height = Math.max(1, Math.round(crop.height * scale));
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (value) =>
            value
              ? resolve(value)
              : reject(new Error("Não foi possível gerar a foto recortada.")),
          "image/webp",
          0.92,
        );
      });
      if (blob.size > 0 && blob.size <= MAX_CROP_BYTES) {
        const extension = {
          "image/webp": "webp",
          "image/png": "png",
          "image/jpeg": "jpg",
        }[blob.type];
        if (!extension)
          throw new Error(
            "O navegador gerou um formato de imagem não compatível.",
          );
        return new File([blob], `foto-reenquadrada.${extension}`, {
          type: blob.type,
        });
      }
      scale *= 0.7;
    }
    throw new Error(
      "O recorte ainda está muito grande. Tente uma imagem menor.",
    );
  } catch (error) {
    if (error.name === "SecurityError") {
      throw new Error(
        "Esse site não permite recortar a imagem por link. Envie o arquivo da foto pelo botão Adicionar fotos.",
      );
    }
    throw error;
  } finally {
    canvas.width = canvas.height = 0;
  }
}
