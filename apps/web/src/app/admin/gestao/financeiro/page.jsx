import { useState } from "react";
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
import { salonDate, formatDate, money } from "@/utils/salon";

export default function FinanceiroPage() {
  const [month, setMonth] = useState(salonDate().slice(0, 7));
  const [type, setType] = useState("");
  const [editing, setEditing] = useState(null);
  const [year, monthNumber] = month.split("-");
  const query = useApi(
    `/api/financial-transactions?year=${year}&month=${monthNumber}`,
  );
  const save = useSave();
  const transactions = (query.data?.transactions || []).filter(
    (item) => !type || item.type === type,
  );
  async function submit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const body = {
      ...Object.fromEntries(fields),
      type: editing.type,
      amount: Number(fields.get("amount")),
      paid: fields.get("paid") === "on",
    };
    try {
      await save.mutateAsync({ url: "/api/financial-transactions", body });
      setEditing(null);
    } catch {
      /* keep entered values */
    }
  }
  return (
    <AdminLayout>
      <PageHeading
        title="Financeiro"
        description="Entradas, despesas e pagamentos do salão."
      >
        <button
          className={secondaryClass}
          onClick={() => setEditing({ type: "saida" })}
        >
          Nova despesa
        </button>
        <button
          className={buttonClass}
          onClick={() => setEditing({ type: "entrada" })}
        >
          Nova entrada
        </button>
      </PageHeading>
      <div className="mb-5 flex flex-wrap gap-4">
        <Field label="Mês">
          <input
            required
            type="month"
            value={month}
            onChange={(event) =>
              event.target.value && setMonth(event.target.value)
            }
            className={inputClass}
          />
        </Field>
        <Field label="Lançamentos">
          <select
            className={inputClass}
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="">Todos</option>
            <option value="entrada">Entradas</option>
            <option value="saida">Saídas</option>
          </select>
        </Field>
      </div>
      <QueryState query={query}>
        {query.data && (
          <>
            <div className="mb-5 grid gap-4 sm:grid-cols-3">
              {[
                ["Entradas recebidas", query.data.summary.totalEntradas],
                ["Despesas pagas", query.data.summary.totalSaidas],
                ["Saldo realizado", query.data.summary.saldo],
              ].map(([label, value]) => (
                <Card key={label}>
                  <p className="text-sm text-[#725744]">{label}</p>
                  <p className="mt-2 text-2xl font-semibold">{money(value)}</p>
                </Card>
              ))}
            </div>
            <Card>
              {!transactions.length ? (
                <p className="text-sm text-[#725744]">
                  Nenhum lançamento neste período.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3">Data / vencimento</th>
                        <th className="p-3">Descrição</th>
                        <th className="p-3">Valor</th>
                        <th className="p-3">Pagamento</th>
                        <th className="p-3">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((item) => (
                        <tr className="border-b last:border-0" key={item.id}>
                          <td className="whitespace-nowrap p-3">
                            {formatDate(item.transaction_date)}
                            {item.due_date && (
                              <small className="block">
                                Vence {formatDate(item.due_date)}
                              </small>
                            )}
                          </td>
                          <td className="min-w-40 p-3">
                            <strong>{item.description || item.category}</strong>
                            <p className="text-[#725744]">{item.category}</p>
                          </td>
                          <td
                            className={`whitespace-nowrap p-3 font-semibold ${item.type === "entrada" ? "text-green-700" : "text-red-700"}`}
                          >
                            {item.type === "saida" ? "− " : "+ "}
                            {money(item.amount)}
                          </td>
                          <td className="p-3">
                            {item.paid ? "Pago" : "Pendente"}
                            <small className="block">
                              {item.payment_method}
                            </small>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                disabled={save.isPending}
                                className={secondaryClass}
                                onClick={() =>
                                  save.mutate({
                                    url: `/api/financial-transactions/${item.id}`,
                                    method: "PUT",
                                    body: { paid: !item.paid },
                                  })
                                }
                              >
                                {item.paid ? "Marcar pendente" : "Marcar pago"}
                              </button>
                              {!item.appointment_id && (
                                <button
                                  disabled={save.isPending}
                                  className={secondaryClass}
                                  onClick={() =>
                                    window.confirm(
                                      "Excluir este lançamento?",
                                    ) &&
                                    save.mutate({
                                      url: `/api/financial-transactions/${item.id}`,
                                      method: "DELETE",
                                    })
                                  }
                                >
                                  Excluir
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </QueryState>
      {editing && (
        <Modal
          title={editing.type === "entrada" ? "Nova entrada" : "Nova despesa"}
          onClose={() => setEditing(null)}
          busy={save.isPending}
        >
          <form onSubmit={submit} className="space-y-4">
            <Field label="Descrição">
              <input
                autoFocus
                name="description"
                required
                maxLength={240}
                className={inputClass}
              />
            </Field>
            <Field label="Categoria">
              <input
                name="category"
                required
                defaultValue={
                  editing.type === "entrada" ? "Serviço" : "Material"
                }
                maxLength={80}
                className={inputClass}
              />
            </Field>
            <Field label="Valor (R$)">
              <input
                name="amount"
                type="number"
                min="0.01"
                max="99999999"
                step="0.01"
                required
                className={inputClass}
              />
            </Field>
            <Field label="Data do lançamento">
              <input
                name="transactionDate"
                type="date"
                defaultValue={salonDate()}
                required
                className={inputClass}
              />
            </Field>
            <Field label="Vencimento (opcional)">
              <input name="dueDate" type="date" className={inputClass} />
            </Field>
            <Field label="Forma de pagamento">
              <select name="paymentMethod" className={inputClass}>
                <option>Pix</option>
                <option>Dinheiro</option>
                <option>Cartão</option>
                <option>Transferência</option>
                <option>Outro</option>
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="paid" defaultChecked />
              Já foi pago
            </label>
            <SaveButton pending={save.isPending} />
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
}
