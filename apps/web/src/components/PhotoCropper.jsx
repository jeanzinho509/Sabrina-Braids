import { useEffect, useId, useRef, useState } from "react";
import {
  buttonClass,
  inputClass,
  secondaryClass,
} from "@/app/admin/components/UI";
import { cropRectangle, exportCrop, moveCrop } from "@/utils/photoCrop";

export default function PhotoCropper({ src, onApply, onCancel }) {
  const id = useId();
  const heading = useRef(null);
  const image = useRef(null);
  const drag = useRef(null);
  const saving = useRef(false);
  const [dimensions, setDimensions] = useState(null);
  const [format, setFormat] = useState("original");
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const photo = new Image();
    photo.crossOrigin = "anonymous";
    photo.onload = () => {
      if (
        !photo.naturalWidth ||
        !photo.naturalHeight ||
        photo.naturalWidth * photo.naturalHeight > 40000000
      ) {
        setError(
          "Escolha uma foto com resolução de até 40 megapixels para reenquadrar.",
        );
        return;
      }
      image.current = photo;
      setDimensions({ width: photo.naturalWidth, height: photo.naturalHeight });
    };
    photo.onerror = () =>
      setError(
        "Não foi possível abrir a foto para recorte. Se ela veio de um link, envie o arquivo da imagem pelo campo de fotos.",
      );
    photo.src = src;
    heading.current?.focus();
    return () => {
      photo.onload = photo.onerror = null;
      photo.src = "";
      image.current = null;
    };
  }, [src]);

  const aspect = dimensions
    ? format === "original"
      ? dimensions.width / dimensions.height
      : Number(format)
    : 1;
  const crop = dimensions
    ? cropRectangle(dimensions.width, dimensions.height, aspect, zoom, position)
    : null;

  function startDrag(event) {
    if (busy || !crop || event.button !== 0 || drag.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      crop,
      bounds: event.currentTarget.getBoundingClientRect(),
    };
  }
  function moveDrag(event) {
    const start = drag.current;
    if (
      !start ||
      start.id !== event.pointerId ||
      busy ||
      !start.bounds.width ||
      !start.bounds.height
    )
      return;
    setPosition(
      moveCrop(
        dimensions,
        start.crop,
        ((event.clientX - start.x) * start.crop.width) / start.bounds.width,
        ((event.clientY - start.y) * start.crop.height) / start.bounds.height,
      ),
    );
  }
  function endDrag(event) {
    if (drag.current?.id === event.pointerId) drag.current = null;
  }
  function moveWithKeyboard(event) {
    const directions = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    if (!directions[event.key] || !crop || busy) return;
    event.preventDefault();
    const [x, y] = directions[event.key];
    const step = event.shiftKey ? 0.1 : 0.02;
    setPosition(
      moveCrop(dimensions, crop, x * crop.width * step, y * crop.height * step),
    );
  }
  async function apply() {
    if (saving.current || !image.current || !crop) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      const file = await exportCrop(image.current, crop);
      await onApply(file);
    } catch (error) {
      setError(
        error.message || "Não foi possível salvar o recorte. Tente novamente.",
      );
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="space-y-4 rounded-xl border border-[#707855] bg-[#fafaf4] p-3 sm:p-4"
    >
      <h3
        ref={heading}
        tabIndex={-1}
        id={`${id}-title`}
        className="font-semibold outline-none"
      >
        Reenquadrar foto
      </h3>
      <p id={`${id}-help`} className="text-sm text-[#5b6247]">
        Arraste a foto com o dedo ou mouse. Também é possível usar as setas do
        teclado na prévia.
      </p>
      {crop && (
        <>
          <label className="block space-y-1 text-sm font-medium">
            <span>Formato do recorte</span>
            <select
              value={format}
              disabled={busy}
              className={inputClass}
              onChange={(event) => {
                setFormat(event.target.value);
                setZoom(1);
                setPosition({ x: 0.5, y: 0.5 });
              }}
            >
              <option value="original">Original</option>
              <option value="1">Quadrado · 1:1</option>
              <option value="0.8">Retrato · 4:5</option>
              <option value={4 / 3}>Paisagem · 4:3</option>
            </select>
          </label>
          <div
            role="group"
            aria-label="Prévia do recorte"
            aria-describedby={`${id}-help`}
            aria-disabled={busy}
            tabIndex={busy ? -1 : 0}
            className="relative mx-auto w-full touch-none select-none overflow-hidden rounded-lg bg-[#e7e7dc] outline-none ring-1 ring-[#707855] focus:ring-4 focus:ring-[#707855]"
            style={{
              aspectRatio: aspect,
              maxWidth: `${52 * aspect}vh`,
              cursor: busy ? "wait" : "grab",
            }}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
            onKeyDown={moveWithKeyboard}
          >
            <img
              src={src}
              crossOrigin="anonymous"
              alt=""
              draggable={false}
              className="pointer-events-none absolute"
              style={{
                maxWidth: "none",
                width: `${(dimensions.width / crop.width) * 100}%`,
                height: `${(dimensions.height / crop.height) * 100}%`,
                left: `${(-crop.x / crop.width) * 100}%`,
                top: `${(-crop.y / crop.height) * 100}%`,
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3"
            >
              {Array.from({ length: 9 }, (_, index) => (
                <span key={index} className="border border-white/30" />
              ))}
            </div>
          </div>
          <label className="block space-y-2 text-sm font-medium">
            <span>Zoom · {zoom.toFixed(1)}×</span>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              disabled={busy}
              aria-label="Zoom"
              onChange={(event) => setZoom(Number(event.target.value))}
              className="block w-full accent-[#29321f]"
            />
          </label>
          <button
            type="button"
            disabled={busy}
            className="text-sm underline"
            onClick={() => {
              setZoom(1);
              setPosition({ x: 0.5, y: 0.5 });
            }}
          >
            Centralizar e redefinir zoom
          </button>
          <p className="text-xs text-[#5b6247]">
            A prévia mostra a área que será salva. Aplique o recorte e depois
            salve o cadastro.
          </p>
        </>
      )}
      {!crop && !error && <p role="status">Carregando foto...</p>}
      {error && (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !crop}
          className={buttonClass}
          onClick={apply}
        >
          {busy ? "Aplicando..." : "Aplicar recorte"}
        </button>
        <button
          type="button"
          disabled={busy}
          className={secondaryClass}
          onClick={onCancel}
        >
          Cancelar recorte
        </button>
      </div>
    </section>
  );
}
