import ServicePhoto from "@/components/ServicePhoto";
import { serviceImage, isDemoImage } from "@/utils/demoCatalog";
import { useState } from "react";
import { toast } from "sonner";
import { AdminLayout } from "@/app/admin/components/AdminLayout";
import {
  Card,
  PageHeading,
  QueryState,
  Modal,
  Field,
  SaveButton,
  inputClass,
  buttonClass,
  secondaryClass,
} from "@/app/admin/components/UI";
import { useApi, useSave } from "@/utils/useApi";
import useUpload from "@/utils/useUpload";
import { money } from "@/utils/salon";

const tabs = { services: "Serviços", gallery: "Galeria", videos: "Vídeos" };
function Editor({ tab, item, onClose }) {
  const save = useSave();
  const [upload, { loading: uploading }] = useUpload();
  const [imageUrl, setImageUrl] = useState(
    tab === "services" ? serviceImage(item) : item.image_url || "",
  );
  async function selectImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const result = await upload({ file });
    if (result.error) toast.error(result.error);
    else setImageUrl(result.url);
  }
  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    let body = values;
    if (tab === "services")
      body = {
        ...values,
        image_url: imageUrl,
        price: Number(values.price),
        duration_minutes: Number(values.duration_minutes),
        active: values.active === "on",
      };
    if (tab === "gallery")
      body = {
        ...values,
        image_url: imageUrl,
        display_order: Number(values.display_order),
        active: values.active === "on",
      };
    if (tab === "videos") {
      const hostname = new URL(values.video_url).hostname;
      body = {
        ...values,
        platform: hostname.includes("youtu")
          ? "youtube"
          : hostname.includes("instagram")
            ? "instagram"
            : hostname.includes("tiktok")
              ? "tiktok"
              : "other",
      };
    }
    if (tab === "gallery" && !imageUrl) {
      toast.error("Escolha uma imagem ou informe o endereço HTTPS.");
      return;
    }
    try {
      await save.mutateAsync({
        url: `/api/${tab}${item.id ? `/${item.id}` : ""}`,
        method: item.id ? "PATCH" : "POST",
        body,
      });
      toast.success("Conteúdo salvo.");
      onClose();
    } catch {
      /* keep input */
    }
  }
  return (
    <Modal
      title={`${item.id ? "Editar" : "Adicionar"} · ${tabs[tab]}`}
      busy={save.isPending || uploading}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        {tab === "services" && (
          <>
            <Field label="Nome do serviço">
              <input
                autoFocus
                name="name"
                required
                maxLength={160}
                defaultValue={item.name}
                className={inputClass}
              />
            </Field>
            <Field label="Descrição">
              <textarea
                name="description"
                maxLength={2000}
                defaultValue={item.description}
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Preço (R$)">
                <input
                  required
                  name="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  defaultValue={item.price}
                  className={inputClass}
                />
              </Field>
              <Field label="Duração (minutos)">
                <input
                  required
                  name="duration_minutes"
                  type="number"
                  min="1"
                  max="720"
                  step="1"
                  defaultValue={item.duration_minutes || 180}
                  className={inputClass}
                />
              </Field>
            </div>
          </>
        )}
        {tab === "gallery" && (
          <>
            <Field label="Legenda">
              <input
                autoFocus
                name="caption"
                maxLength={240}
                defaultValue={item.caption}
                className={inputClass}
              />
            </Field>
            <Field label="Ordem de exibição">
              <input
                name="display_order"
                type="number"
                min="0"
                defaultValue={item.display_order || 0}
                className={inputClass}
              />
            </Field>
          </>
        )}
        {tab !== "videos" && (
          <>
            <Field label="Imagem (JPG, PNG ou WebP, até 2 MB)">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={selectImage}
                className="block w-full text-sm"
              />
            </Field>
            <Field label="Ou endereço HTTPS da imagem">
              <input
                type="url"
                placeholder="https://..."
                value={imageUrl.startsWith("https:") ? imageUrl : ""}
                onChange={(event) => setImageUrl(event.target.value)}
                className={inputClass}
              />
            </Field>
            {imageUrl && (
              <div>
                <img
                  src={imageUrl}
                  alt="Prévia da imagem"
                  className="h-40 w-full rounded-xl object-cover"
                />
                {isDemoImage(imageUrl) && (
                  <p className="mt-2 text-xs text-[#725744]">
                    Imagem ilustrativa. Envie uma foto real para substituir.
                  </p>
                )}
                <button
                  type="button"
                  className="mt-2 text-sm underline"
                  onClick={() => setImageUrl("")}
                >
                  Remover imagem
                </button>
              </div>
            )}
            {uploading && <p role="status">Preparando imagem...</p>}
            <label className="flex items-center gap-2 text-sm">
              <input
                name="active"
                type="checkbox"
                defaultChecked={item.active !== false}
              />
              Exibir no site
            </label>
          </>
        )}
        {tab === "videos" && (
          <>
            <Field label="Título">
              <input
                autoFocus
                required
                name="title"
                maxLength={240}
                defaultValue={item.title}
                className={inputClass}
              />
            </Field>
            <Field label="Link do vídeo (HTTPS)">
              <input
                name="video_url"
                required
                type="url"
                pattern="https://.*"
                defaultValue={item.video_url}
                className={inputClass}
              />
            </Field>
            <Field label="Capa (endereço HTTPS, opcional)">
              <input
                name="thumbnail_url"
                type="url"
                pattern="https://.*"
                defaultValue={item.thumbnail_url}
                className={inputClass}
              />
            </Field>
          </>
        )}
        <SaveButton pending={save.isPending || uploading} />
      </form>
    </Modal>
  );
}
export default function ServicesPage() {
  const [tab, setTab] = useState("services");
  const [editing, setEditing] = useState(null);
  const query = useApi(`/api/${tab}${tab !== "videos" ? "?active=false" : ""}`);
  const save = useSave();
  const items = query.data?.[tab] || [];
  return (
    <AdminLayout>
      <PageHeading
        title="Site e serviços"
        description="Atualize o catálogo, as fotos e os vídeos que suas clientes veem."
      >
        <button className={buttonClass} onClick={() => setEditing({})}>
          Adicionar{" "}
          {tab === "services"
            ? "serviço"
            : tab === "gallery"
              ? "foto"
              : "vídeo"}
        </button>
      </PageHeading>
      <div className="mb-6 flex gap-2" aria-label="Tipos de conteúdo">
        {Object.entries(tabs).map(([key, label]) => (
          <button
            key={key}
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
            className={tab === key ? buttonClass : secondaryClass}
          >
            {label}
          </button>
        ))}
      </div>
      <QueryState query={query} empty={!items.length}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id}>
              {tab === "services" && (
                <ServicePhoto
                  service={item}
                  admin
                  className="mb-4 h-48 rounded-xl"
                />
              )}
              {tab !== "services" && (item.image_url || item.thumbnail_url) && (
                <img
                  src={item.image_url || item.thumbnail_url}
                  alt={
                    item.caption ||
                    item.name ||
                    item.title ||
                    "Tranças Sabrina Braids"
                  }
                  loading="lazy"
                  className="mb-4 h-48 w-full rounded-xl object-cover"
                />
              )}
              <h2 className="text-lg font-semibold">
                {item.name || item.title || item.caption || "Foto da galeria"}
              </h2>
              {item.active === false && (
                <p className="my-2 text-sm text-amber-800">Oculto no site</p>
              )}
              {tab === "services" && (
                <>
                  <p className="my-2 text-sm text-[#725744]">
                    {item.description}
                  </p>
                  <p className="my-3 font-semibold">
                    {money(item.price)} · {item.duration_minutes} min
                  </p>
                </>
              )}
              {tab === "videos" && (
                <a
                  href={item.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="my-3 inline-block text-sm underline"
                >
                  Abrir vídeo
                </a>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className={secondaryClass}
                  onClick={() => setEditing(item)}
                >
                  Editar
                </button>
                {item.active !== false && (
                  <button
                    className={secondaryClass}
                    disabled={save.isPending}
                    onClick={() =>
                      window.confirm(
                        tab === "gallery"
                          ? "Excluir esta foto da galeria?"
                          : "Ocultar este conteúdo do site?",
                      ) &&
                      save.mutate({
                        url: `/api/${tab}/${item.id}`,
                        method: "DELETE",
                      })
                    }
                  >
                    {tab === "gallery" ? "Excluir" : "Ocultar"}
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </QueryState>
      {editing && (
        <Editor tab={tab} item={editing} onClose={() => setEditing(null)} />
      )}
    </AdminLayout>
  );
}
