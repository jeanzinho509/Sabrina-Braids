import { Link } from "react-router";
import { AdminLayout } from "@/app/admin/components/AdminLayout";
import { Card, PageHeading, QueryState } from "@/app/admin/components/UI";
import { useApi, useSave } from "@/utils/useApi";
import { money, formatDate } from "@/utils/salon";

export default function Dashboard() {
  const query = useApi("/api/dashboard-summary");
  const save = useSave();
  const data = query.data;
  return (
    <AdminLayout>
      <PageHeading
        title="Seu salão, em dia"
        description="Acompanhe os atendimentos, o caixa e as prioridades de hoje."
      />
      <QueryState query={query}>
        {data && (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Card>
                <p className="text-sm text-[#725744]">Atendimentos de hoje</p>
                <p className="mt-3 text-3xl font-semibold">
                  {data.todayClients}
                </p>
                <Link
                  className="mt-3 inline-block text-sm underline"
                  to="/admin/gestao/agenda"
                >
                  Abrir agenda
                </Link>
              </Card>
              <Card>
                <p className="text-sm text-[#725744]">Receita recebida hoje</p>
                <p className="mt-3 text-3xl font-semibold">
                  {money(data.todayRevenue)}
                </p>
                <Link
                  className="mt-3 inline-block text-sm underline"
                  to="/admin/gestao/financeiro"
                >
                  Ver financeiro
                </Link>
              </Card>
              <Card>
                <p className="text-sm text-[#725744]">
                  Meta de faturamento do mês
                </p>
                <p className="mt-3 text-2xl font-semibold">
                  {money(data.goal.current)}
                </p>
                <progress
                  className="my-3 h-3 w-full accent-[#8c6b52]"
                  value={data.goal.percent}
                  max="100"
                  aria-label="Progresso da meta"
                />
                <p className="text-sm">
                  {data.goal.target > 0
                    ? `${data.goal.percent}% de ${money(data.goal.target)}`
                    : "Defina uma meta para acompanhar seu progresso."}
                </p>
                <Link
                  className="mt-3 inline-block text-sm underline"
                  to="/admin/gestao/tarefas-metas"
                >
                  Editar meta
                </Link>
              </Card>
            </div>
            <div className="grid gap-4 xl:grid-cols-3">
              <Card>
                <h2 className="mb-4 text-lg font-semibold">
                  Tarefas prioritárias
                </h2>
                {!data.priorityTasks.length && (
                  <p className="text-sm text-[#725744]">
                    Nenhuma tarefa prioritária pendente.
                  </p>
                )}
                <ul className="space-y-3">
                  {data.priorityTasks.map((task) => (
                    <li key={task.id}>
                      <label className="flex items-start gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={false}
                          disabled={save.isPending}
                          onChange={() =>
                            save.mutate({
                              url: `/api/tasks/${task.id}`,
                              method: "PUT",
                              body: { done: true },
                            })
                          }
                          className="mt-1 accent-[#8c6b52]"
                        />
                        {task.text}
                      </label>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card>
                <h2 className="mb-4 text-lg font-semibold">
                  Estoque para repor
                </h2>
                {!data.lowStock.length && (
                  <p className="text-sm text-[#725744]">
                    Nenhum produto abaixo do mínimo.
                  </p>
                )}
                <ul className="space-y-3">
                  {data.lowStock.map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between gap-2 text-sm"
                    >
                      <span>{item.name}</span>
                      <span className="text-red-700">
                        {item.quantity} /{" "}
                        {Math.max(3, Number(item.min_quantity))} {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card>
                <h2 className="mb-4 text-lg font-semibold">Contas pendentes</h2>
                {!data.upcomingBills.length && (
                  <p className="text-sm text-[#725744]">
                    Nenhuma conta pendente com vencimento.
                  </p>
                )}
                <ul className="space-y-3">
                  {data.upcomingBills.map((bill) => (
                    <li
                      key={bill.id}
                      className="flex justify-between gap-3 text-sm"
                    >
                      <span>
                        {bill.description || bill.category}
                        <small className="block text-[#725744]">
                          {formatDate(bill.due_date)}
                        </small>
                      </span>
                      <strong>{money(bill.amount)}</strong>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </>
        )}
      </QueryState>
    </AdminLayout>
  );
}
