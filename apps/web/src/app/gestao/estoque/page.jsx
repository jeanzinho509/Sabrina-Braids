import { useState } from "react";
import { GestaoLayout } from "../components/GestaoLayout";
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
import { useApi, useSave } from "@/utils/useApi";

export default function EstoquePage() {
  const query = useApi("/api/stock-items");
  const save = useSave();
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const items = (query.data?.items || []).filter((item) =>
    item.name
      .toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR")),
  );
  async function submit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const body = {
      ...Object.fromEntries(fields),
      quantity: Number(fields.get("quantity")),
      minQuantity: Number(fields.get("minQuantity")),
    };
    try {
      await save.mutateAsync({
        url: editing.id ? `/api/stock-items/${editing.id}` : "/api/stock-items",
        method: editing.id ? "PUT" : "POST",
        body,
      });
      setEditing(null);
    } catch {
      /* form stays open */
    }
  }
  return (
    <GestaoLayout>
      <PageHeading
        title="Estoque"
        description="Controle os materiais e saiba o que precisa repor."
      >
        <button className={buttonClass} onClick={() => setEditing({})}>
          Novo produto
        </button>
      </PageHeading>
      <input
        aria-label="Buscar produto"
        placeholder="Buscar produto"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className={`${inputClass} mb-5 max-w-md`}
      />
      <QueryState query={query} empty={!items.length}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id}>
              <h2 className="text-lg font-semibold">{item.name}</h2>
              <p className="my-3 text-3xl font-semibold">
                {item.quantity}{" "}
                <span className="text-base font-normal">{item.unit}</span>
              </p>
              <p className="mb-4 text-sm text-[#725744]">
                Mínimo: {item.min_quantity} {item.unit}
              </p>
              {Number(item.quantity) <= Number(item.min_quantity) && (
                <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                  Hora de repor este produto
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  className={secondaryClass}
                  onClick={() => setEditing(item)}
                >
                  Ajustar estoque
                </button>
                <button
                  className={secondaryClass}
                  disabled={save.isPending}
                  onClick={() =>
                    window.confirm(`Excluir ${item.name} do estoque?`) &&
                    save.mutate({
                      url: `/api/stock-items/${item.id}`,
                      method: "DELETE",
                    })
                  }
                >
                  Excluir
                </button>
              </div>
            </Card>
          ))}
        </div>
      </QueryState>
      {editing && (
        <Modal
          title={editing.id ? "Ajustar estoque" : "Novo produto"}
          onClose={() => setEditing(null)}
          busy={save.isPending}
        >
          <form onSubmit={submit} className="space-y-4">
            <Field label="Nome do produto">
              <input
                autoFocus
                required
                name="name"
                maxLength={160}
                defaultValue={editing.name}
                className={inputClass}
              />
            </Field>
            <Field label="Quantidade atual">
              <input
                required
                name="quantity"
                type="number"
                min="0"
                step="1"
                defaultValue={editing.quantity ?? 0}
                className={inputClass}
              />
            </Field>
            <Field label="Quantidade mínima">
              <input
                required
                name="minQuantity"
                type="number"
                min="0"
                step="1"
                defaultValue={editing.min_quantity ?? 1}
                className={inputClass}
              />
            </Field>
            <Field label="Unidade">
              <input
                required
                name="unit"
                maxLength={20}
                defaultValue={editing.unit || "un"}
                className={inputClass}
              />
            </Field>
            <SaveButton pending={save.isPending} />
          </form>
        </Modal>
      )}
    </GestaoLayout>
  );
}
