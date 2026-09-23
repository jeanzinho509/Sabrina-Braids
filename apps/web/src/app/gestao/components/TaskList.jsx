import { useState } from "react";
import { useApi, useSave } from "@/utils/useApi";
import { formatDate } from "@/utils/salon";
import {
  Card,
  Field,
  QueryState,
  inputClass,
  buttonClass,
  secondaryClass,
} from "./UI";

export function TaskList({ category, title }) {
  const query = useApi(`/api/tasks?category=${category}`);
  const save = useSave();
  const [text, setText] = useState("");
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    try {
      await save.mutateAsync({
        url: "/api/tasks",
        body: {
          text: text.trim(),
          category,
          priority: fields.get("priority") === "on",
          dueDate: fields.get("dueDate"),
        },
      });
      setText("");
      form.reset();
    } catch {
      /* retain form values */
    }
  }
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <QueryState query={query}>
        <ul className="mb-5 space-y-3">
          {query.data?.tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-start gap-3 rounded-xl border border-[#e8dcc8] p-3"
            >
              <label className="flex min-w-0 flex-1 items-start gap-3">
                <input
                  type="checkbox"
                  checked={task.done}
                  disabled={save.isPending}
                  className="mt-1 accent-[#8c6b52]"
                  onChange={() =>
                    save.mutate({
                      url: `/api/tasks/${task.id}`,
                      method: "PUT",
                      body: { done: !task.done },
                    })
                  }
                />
                <span
                  className={`min-w-0 break-words text-sm ${task.done ? "text-[#725744] line-through" : "text-[#1a1513]"}`}
                >
                  {task.text}
                  {task.priority && (
                    <small className="ml-2 text-amber-800">Prioritária</small>
                  )}
                  {task.due_date && (
                    <small className="block">
                      Até {formatDate(task.due_date)}
                    </small>
                  )}
                </span>
              </label>
              <button
                aria-label={`Excluir tarefa: ${task.text}`}
                disabled={save.isPending}
                className={secondaryClass}
                onClick={() =>
                  window.confirm("Excluir esta tarefa?") &&
                  save.mutate({
                    url: `/api/tasks/${task.id}`,
                    method: "DELETE",
                  })
                }
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        {!query.data?.tasks.length && (
          <p className="mb-5 text-sm text-[#725744]">
            Nenhuma tarefa cadastrada.
          </p>
        )}
      </QueryState>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Nova tarefa">
          <input
            required
            maxLength={500}
            value={text}
            onChange={(event) => setText(event.target.value)}
            className={inputClass}
          />
        </Field>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Prazo (opcional)">
            <input name="dueDate" type="date" className={inputClass} />
          </Field>
          <label className="flex items-center gap-2 py-3 text-sm">
            <input type="checkbox" name="priority" />
            Prioritária
          </label>
        </div>
        <button
          disabled={save.isPending || !text.trim()}
          className={buttonClass}
        >
          Adicionar tarefa
        </button>
      </form>
    </Card>
  );
}
