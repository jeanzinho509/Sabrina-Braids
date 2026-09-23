import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/admin";

// PUT - Atualizar tarefa (ex: marcar como feita)
export async function PUT(request, { params }) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    if (
      body.text !== undefined &&
      (typeof body.text !== "string" ||
        !body.text.trim() ||
        body.text.length > 500)
    )
      return Response.json(
        { error: "Informe uma tarefa de até 500 caracteres." },
        { status: 400 },
      );
    const { text, done, category, priority, dueDate } = body;

    const result = await sql`
      UPDATE tasks
      SET
        text = COALESCE(${text ?? null}, text),
        done = COALESCE(${done ?? null}, done),
        category = COALESCE(${category ?? null}, category),
        priority = COALESCE(${priority ?? null}, priority),
        due_date = COALESCE(${dueDate ?? null}, due_date)
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return Response.json({ error: "Tarefa não encontrada" }, { status: 404 });
    }

    return Response.json({ task: result[0] });
  } catch (error) {
    console.error("Error updating task:", error);
    return Response.json(
      { error: "Erro ao atualizar tarefa" },
      { status: 500 },
    );
  }
}

// DELETE - Remover tarefa
export async function DELETE(request, { params }) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { id } = params;
    const result = await sql`DELETE FROM tasks WHERE id = ${id} RETURNING id`;

    if (result.length === 0) {
      return Response.json({ error: "Tarefa não encontrada" }, { status: 404 });
    }

    return Response.json({ message: "Tarefa removida com sucesso" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return Response.json({ error: "Erro ao remover tarefa" }, { status: 500 });
  }
}
