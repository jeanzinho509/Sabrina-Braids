import { useEffect, useId, useRef } from "react";

export const inputClass =
  "w-full rounded-xl border border-[#dfd2c5] bg-white px-3 py-2.5 text-sm text-[#1a1513] focus:outline-none focus:ring-2 focus:ring-[#8c6b52]";
export const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#29321f] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#444c35] disabled:opacity-50 disabled:cursor-wait";
export const secondaryClass =
  "inline-flex items-center justify-center rounded-lg border border-[#dfd2c5] px-3 py-2 text-sm font-medium hover:bg-[#f0e6da] disabled:opacity-50";

export function PageHeading({ title, description, children }) {
  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#1a1513]">
          {title}
        </h1>
        <p className="mt-2 text-sm text-[#725744]">{description}</p>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
export function Card({ children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-[#e8dcc8] bg-white p-5 sm:p-6 shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}
export function Field({ label, children }) {
  return (
    <label className="block space-y-1.5 text-sm font-medium text-[#5c4737]">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function QueryState({ query, empty, children }) {
  if (query.isPending)
    return (
      <p role="status" className="py-10 text-center text-[#725744]">
        Carregando...
      </p>
    );
  if (query.isError)
    return (
      <div role="alert" className="my-4 rounded-xl bg-red-50 p-4 text-red-800">
        <p>{query.error.message}</p>
        <button
          type="button"
          onClick={() => query.refetch()}
          className={`${secondaryClass} mt-3`}
        >
          Tentar novamente
        </button>
      </div>
    );
  if (empty)
    return (
      <p className="py-10 text-center text-[#725744]">
        Nenhum registro encontrado.
      </p>
    );
  return children;
}
export function Modal({ title, onClose, children, busy }) {
  const ref = useRef(null);
  const heading = useId();
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={heading}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className="w-[calc(100%-2rem)] max-w-lg rounded-2xl p-0 shadow-2xl backdrop:bg-black/50"
    >
      <div className="max-h-[85vh] overflow-y-auto p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id={heading} className="text-xl font-semibold">
            {title}
          </h2>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            aria-label="Fechar"
            className={secondaryClass}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
export function SaveButton({ pending }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${buttonClass} w-full`}
    >
      {pending ? "Salvando..." : "Salvar"}
    </button>
  );
}
