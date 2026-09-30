import { useState } from "react";
import { toast } from "sonner";
import { AdminLayout } from "../components/AdminLayout";
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
} from "../components/UI";
import ProductPhoto from "@/components/ProductPhoto";
import { useApi, useSave } from "@/utils/useApi";
import useUpload from "@/utils/useUpload";
import { money } from "@/utils/salon";

const categories = ["Finalizadores", "Cuidados capilares", "Acessórios"];
function ProductEditor({ item, onClose }) {
  const save = useSave();
  const [upload, { loading: uploading }] = useUpload();
  const [imageUrl, setImageUrl] = useState(item.image_url || "");
  const [error, setError] = useState("");
  async function selectImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const result = await upload({ file });
    if (result.error) setError(result.error);
    else {
      setError("");
      setImageUrl(result.url);
    }
    event.target.value = "";
  }
  async function submit(event) {
    event.preventDefault();
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const body = {
      ...values,
      image_url: imageUrl,
      price: values.price === "" ? null : Number(values.price),
      display_order: Number(values.display_order),
      active: values.active === "on",
      available: values.available === "on",
    };
    if (body.active && !imageUrl) {
      setError(
        "Adicione uma foto ou desmarque Exibir no site para salvar um rascunho.",
      );
      return;
    }
    try {
      await save.mutateAsync({
        url: `/api/products${item.id ? `/${item.id}` : ""}`,
        method: item.id ? "PATCH" : "POST",
        body,
      });
      toast.success("Produto salvo.");
      onClose();
    } catch (error) {
      setError(error.message);
    }
  }
  return (
    <Modal
      title={item.id ? "Editar produto" : "Adicionar produto"}
      onClose={onClose}
      busy={save.isPending || uploading}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nome do produto">
          <input
            autoFocus
            name="name"
            required
            maxLength={160}
            defaultValue={item.name}
            placeholder="Ex.: Gelatina, touca de cetim, durag"
            className={inputClass}
          />
        </Field>
        <Field label="Categoria">
          <input
            name="category"
            required
            maxLength={80}
            list="product-categories"
            defaultValue={item.category || "Cuidados capilares"}
            className={inputClass}
          />
          <datalist id="product-categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </Field>
        <Field label="Descrição">
          <textarea
            name="description"
            maxLength={2000}
            defaultValue={item.description}
            placeholder="Marca, tamanho, cor e informações sobre o produto."
            className={inputClass}
            rows={3}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Preço (R$), opcional">
            <input
              name="price"
              type="number"
              min="0.01"
              max="9999999999.99"
              step="0.01"
              defaultValue={item.price ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Ordem de exibição">
            <input
              name="display_order"
              type="number"
              min="0"
              max="100000"
              step="1"
              required
              defaultValue={item.display_order || 0}
              className={inputClass}
            />
          </Field>
        </div>
        <p className="text-xs text-[#725744]">
          Sem preço preenchido, o site mostra “Preço sob consulta”. Os menores
          números aparecem primeiro.
        </p>
        <Field label="Foto do produto (até 2 MB)">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={selectImage}
            className="block w-full text-sm"
          />
        </Field>
        <Field label="Ou endereço HTTPS da foto">
          <input
            type="url"
            pattern="https://.*"
            placeholder="https://..."
            value={imageUrl.startsWith("https:") ? imageUrl : ""}
            onChange={(event) => setImageUrl(event.target.value)}
            className={inputClass}
          />
        </Field>
        {imageUrl && (
          <div>
            <ProductPhoto
              product={{ name: "Prévia do produto", image_url: imageUrl }}
              className="h-44 rounded-xl"
            />
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="mt-2 text-sm underline"
            >
              Remover foto
            </button>
          </div>
        )}
        {uploading && (
          <p role="status" className="text-sm">
            Preparando foto...
          </p>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            name="available"
            type="checkbox"
            defaultChecked={item.available !== false}
          />
          Disponível na loja
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            name="active"
            type="checkbox"
            defaultChecked={item.active !== false}
          />
          Exibir no site
        </label>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
          </p>
        )}
        <SaveButton pending={save.isPending || uploading} />
      </form>
    </Modal>
  );
}

export default function ProductsPage() {
  const query = useApi("/api/products?active=false");
  const save = useSave();
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const products = query.data?.products || [];
  const visible = products.filter((product) =>
    `${product.name} ${product.category}`
      .toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR")),
  );
  return (
    <AdminLayout>
      <PageHeading
        title="Produtos"
        description="Cadastre fotos, preços e informações dos produtos que aparecem no site."
      >
        <a href="/#products" className={secondaryClass}>
          Ver no site
        </a>
        <button
          type="button"
          className={buttonClass}
          onClick={() => setEditing({})}
        >
          Adicionar produto
        </button>
      </PageHeading>
      <div className="mb-6 max-w-md">
        <Field label="Buscar produto">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome ou categoria"
            className={inputClass}
          />
        </Field>
      </div>
      <QueryState query={query}>
        {!products.length ? (
          <Card>
            <h2 className="mb-2 text-lg font-semibold">Comece seu catálogo</h2>
            <p className="text-sm leading-6 text-[#725744]">
              Adicione gel, cera, gelatina, touca de cetim, mousse, durag, wig
              cap, presilhas, perfume de cabelo, finalizador ou tônico capilar.
              Envie a foto real e marque “Exibir no site” para publicar.
            </p>
          </Card>
        ) : !visible.length ? (
          <p className="text-sm text-[#725744]">
            Nenhum produto corresponde à busca.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((product) => (
              <Card key={product.id} className="flex flex-col">
                <ProductPhoto
                  product={product}
                  className="mb-4 aspect-square rounded-xl"
                />
                <p className="text-xs text-[#725744]">{product.category}</p>
                <h2 className="mt-1 break-words text-lg font-semibold">
                  {product.name}
                </h2>
                <p className="mt-2 font-medium">
                  {product.price === null
                    ? "Preço sob consulta"
                    : money(product.price)}
                </p>
                <p
                  className={`mt-2 text-sm ${product.active ? "text-emerald-800" : "text-amber-800"}`}
                >
                  {product.active ? "Visível no site" : "Oculto no site"}
                </p>
                {!product.available && (
                  <p className="mt-1 text-sm text-[#725744]">
                    Indisponível no momento
                  </p>
                )}
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  <button
                    type="button"
                    className={secondaryClass}
                    onClick={() => setEditing(product)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className={secondaryClass}
                    disabled={save.isPending}
                    onClick={() =>
                      save.mutate({
                        url: `/api/products/${product.id}`,
                        method: "PATCH",
                        body: { active: !product.active },
                      })
                    }
                  >
                    {product.active ? "Ocultar" : "Exibir no site"}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </QueryState>
      {editing && (
        <ProductEditor item={editing} onClose={() => setEditing(null)} />
      )}
    </AdminLayout>
  );
}
