import { useCallback, useState } from "react";
const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];
export default function useUpload() {
  const [loading, setLoading] = useState(false);
  const upload = useCallback(async (input) => {
    setLoading(true);
    try {
      if (input.url) {
        const url = new URL(input.url);
        if (url.protocol !== "https:")
          throw new Error("Use uma imagem com endereço HTTPS.");
        return { url: url.href };
      }
      let value = input.base64;
      if (input.file) {
        if (!TYPES.includes(input.file.type) || input.file.size > MAX_BYTES)
          throw new Error("Escolha uma imagem JPG, PNG ou WebP de até 2 MB.");
        value = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () =>
            reject(new Error("Não foi possível ler a imagem."));
          reader.readAsDataURL(input.file);
        });
      }
      if (
        typeof value !== "string" ||
        value.length > Math.ceil((MAX_BYTES * 4) / 3) + 40 ||
        !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(value)
      )
        throw new Error("Escolha uma imagem JPG, PNG ou WebP de até 2 MB.");
      // The image is persisted with the service, gallery entry or booking in Postgres.
      return { url: value, mimeType: value.split(";")[0].slice(5) };
    } catch (error) {
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);
  return [upload, { loading }];
}
export { useUpload };
