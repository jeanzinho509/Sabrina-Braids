import { useEffect, useId, useRef, useState } from "react";
import PhotoCropper from "@/components/PhotoCropper";
import useUpload from "@/utils/useUpload";
import { apiRequest } from "@/utils/useApi";
import { MAX_PHOTOS } from "@/utils/photos";
import { isDemoImage } from "@/utils/demoCatalog";

export default function PhotoEditor({ photos, onChange, onBusyChange }) {
  const id = useId();
  const [upload] = useUpload();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const cropButtons = useRef([]);
  const restoreFocus = useRef(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    onBusyChange(busy || editing !== null);
    if (!editing && restoreFocus.current !== null) {
      cropButtons.current[restoreFocus.current]?.focus();
      restoreFocus.current = null;
    }
  }, [busy, editing, onBusyChange]);
  function finishCrop() {
    restoreFocus.current = editing.index;
    setEditing(null);
  }
  async function applyCrop(file) {
    const result = await upload({ file });
    if (result.error) throw new Error(result.error);
    const saved = await apiRequest("/api/media", {
      method: "POST",
      body: JSON.stringify({ image: result.url }),
    });
    onChange(
      photos.map((src, index) => (index === editing.index ? saved.url : src)),
    );
    finishCrop();
  }
  async function selectFiles(event) {
    const files = [...(event.target.files || [])];
    event.target.value = "";
    if (!files.length) return;
    if (files.length + photos.length > MAX_PHOTOS) {
      setError(`Escolha até ${MAX_PHOTOS} fotos por item.`);
      return;
    }
    setBusy(true);
    setError("");
    const next = [...photos];
    try {
      // One bounded request per image; the catalog only stores their URLs.
      for (const file of files) {
        const result = await upload({ file });
        if (result.error) throw new Error(result.error);
        const saved = await apiRequest("/api/media", {
          method: "POST",
          body: JSON.stringify({ image: result.url }),
        });
        next.push(saved.url);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      onChange(next);
      setBusy(false);
    }
  }
  function addUrl() {
    try {
      const parsed = new URL(url.trim());
      if (
        parsed.protocol !== "https:" ||
        parsed.username ||
        parsed.password ||
        parsed.href.length > 2048
      )
        throw new Error();
      if (photos.length >= MAX_PHOTOS) {
        setError(`Use até ${MAX_PHOTOS} fotos.`);
        return;
      }
      onChange([...new Set([...photos, parsed.href])]);
      setUrl("");
      setError("");
    } catch {
      setError("Informe um endereço HTTPS válido para a foto.");
    }
  }
  return (
    <>
      {editing && (
        <PhotoCropper
          key={editing.src}
          src={editing.src}
          onApply={applyCrop}
          onCancel={finishCrop}
        />
      )}
      <fieldset
        disabled={busy}
        hidden={editing !== null}
        className="space-y-3 rounded-xl border border-[#d6d9c5] p-4"
      >
        <legend className="px-1 text-sm font-semibold">
          Fotos ({photos.length}/{MAX_PHOTOS})
        </legend>
        <p className="text-xs leading-5 text-[#5b6247]">
          A primeira foto é a capa. Envie até 8 fotos JPG, PNG ou WebP de até 2
          MB cada. Use Reenquadrar para ajustar o corte de uma foto.
        </p>
        <label htmlFor={`${id}-files`} className="block text-sm font-medium">
          Adicionar fotos
        </label>
        <input
          id={`${id}-files`}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={selectFiles}
          disabled={busy || photos.length >= MAX_PHOTOS}
          className="block w-full min-w-0 text-sm"
        />
        <label htmlFor={`${id}-url`} className="block text-sm font-medium">
          Ou endereço HTTPS da foto
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id={`${id}-url`}
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://..."
            className="min-w-0 flex-1 rounded-lg border border-[#d6d9c5] px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={addUrl}
            disabled={!url || photos.length >= MAX_PHOTOS}
            className="rounded-lg border border-[#707855] px-3 py-2 text-sm disabled:opacity-50"
          >
            Adicionar link
          </button>
        </div>
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((src, index) => (
            <li
              key={src}
              className="overflow-hidden rounded-lg border border-[#d6d9c5] bg-white"
            >
              <img
                src={src}
                alt={`Foto ${index + 1}${index === 0 ? " — capa" : ""}`}
                className="h-28 w-full object-contain"
              />
              <div className="space-y-2 p-2 text-xs">
                <p className="font-semibold">
                  {index === 0 ? "Capa" : `Foto ${index + 1}`}
                  {isDemoImage(src) ? " · ilustrativa" : ""}
                </p>
                <button
                  ref={(element) => {
                    cropButtons.current[index] = element;
                  }}
                  type="button"
                  aria-label={`Reenquadrar foto ${index + 1}`}
                  className="block min-h-8 font-medium underline"
                  onClick={() => {
                    setError("");
                    setEditing({ src, index });
                  }}
                >
                  Reenquadrar
                </button>
                {index > 0 && (
                  <button
                    type="button"
                    className="block min-h-8 underline"
                    onClick={() =>
                      onChange([src, ...photos.filter((_, i) => i !== index)])
                    }
                  >
                    Usar como capa
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`Remover foto ${index + 1}`}
                  className="block min-h-8 text-red-800 underline"
                  onClick={() => onChange(photos.filter((_, i) => i !== index))}
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ol>
        {busy && (
          <p role="status" className="text-sm">
            Salvando fotos...
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-800">
            {error}
          </p>
        )}
      </fieldset>
    </>
  );
}
