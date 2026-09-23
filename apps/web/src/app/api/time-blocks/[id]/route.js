import { requireAdmin } from "@/app/api/utils/admin";
import sql from "@/app/api/utils/sql";

// DELETE - Remover bloqueio de horário
export async function DELETE(request, { params }) {
  if (!(await requireAdmin()))
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  try {
    const { id } = params;

    const result = await sql`
      DELETE FROM time_blocks
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return Response.json(
        { error: "Bloqueio não encontrado" },
        { status: 404 },
      );
    }

    return Response.json({
      message: "Bloqueio removido com sucesso!",
    });
  } catch (error) {
    console.error("Error deleting time block:", error);
    return Response.json(
      { error: "Erro ao remover bloqueio" },
      { status: 500 },
    );
  }
}
