import { AdminLayout } from "@/app/admin/components/AdminLayout";
import { TaskList } from "@/app/admin/components/TaskList";
import {
  Card,
  PageHeading,
  QueryState,
  Field,
  SaveButton,
  inputClass,
} from "@/app/admin/components/UI";
import { useApi, useSave } from "@/utils/useApi";
import { salonDate, money } from "@/utils/salon";
import { toast } from "sonner";

export default function TarefasMetasPage() {
  const query = useApi("/api/dashboard-summary");
  const save = useSave();
  const [year, month] = salonDate().split("-").map(Number);
  async function submit(event) {
    event.preventDefault();
    const targetAmount = Number(
      new FormData(event.currentTarget).get("target"),
    );
    try {
      await save.mutateAsync({
        url: "/api/monthly-goals",
        body: { year, month, targetAmount },
      });
      toast.success("Meta atualizada.");
    } catch {
      /* toast in useSave */
    }
  }
  return (
    <AdminLayout>
      <PageHeading
        title="Tarefas e metas"
        description="Organize as prioridades e acompanhe o faturamento do mês."
      />
      <div className="grid items-start gap-5 xl:grid-cols-2">
        <TaskList category="salao" title="Tarefas do salão" />
        <Card>
          <h2 className="mb-5 text-lg font-semibold">
            Meta de faturamento · {String(month).padStart(2, "0")}/{year}
          </h2>
          <QueryState query={query}>
            {query.data && (
              <>
                <p className="text-3xl font-semibold">
                  {money(query.data.goal.current)}
                </p>
                <p className="mt-2 text-sm text-[#725744]">
                  Recebidos neste mês
                </p>
                <progress
                  className="my-5 h-3 w-full accent-[#8c6b52]"
                  value={query.data.goal.percent}
                  max="100"
                  aria-label="Progresso da meta"
                />
                <p className="mb-5 text-sm">
                  {query.data.goal.percent}% da meta de{" "}
                  {money(query.data.goal.target)}
                </p>
                <form onSubmit={submit} className="space-y-4">
                  <Field label="Meta do mês (R$)">
                    <input
                      key={query.data.goal.target}
                      name="target"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      defaultValue={query.data.goal.target}
                      className={inputClass}
                    />
                  </Field>
                  <SaveButton pending={save.isPending} />
                </form>
              </>
            )}
          </QueryState>
        </Card>
      </div>
    </AdminLayout>
  );
}
