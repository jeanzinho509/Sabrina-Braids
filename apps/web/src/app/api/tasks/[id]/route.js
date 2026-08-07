import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

const ALLOWED_ADMINS = ["jean.dev.com@gmail.com", "estimesabrina15@gmail.com"];

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return false;
  return ALLOWED_ADMINS.includes(session.user.email.toLowerCase().trim());
}

// PUT - Atualizar tarefa (ex: marcar como feita)
export async function PUT(request, { params }) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { text, done, category, priority, dueDate } = body;

    const result = await sql`
      UPDATE tasks
      SET
        text = COALESCE(${text}, text),
        done = COALESCE(${done}, done),
        category = COALESCE(${category}, category),
        priority = COALESCE(${priority}, priority),
        due_date = COALESCE(${dueDate}, due_date)
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return Response.json({ error: "Tarefa não encontrada" }, { status: 404 });
    }

    return Response.json({ task: result[0] });
  } catch (error) {
    console.error("Error updating task:", error);
    return Response.json({ error: "Erro ao atualizar tarefa" }, { status: 500 });
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
