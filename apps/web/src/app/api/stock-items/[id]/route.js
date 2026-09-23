import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/admin";

// PUT - Atualizar item (ex: ajustar quantidade após uso/compra)
export async function PUT(request, { params }) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    if (
      [body.quantity, body.minQuantity].some(
        (value) =>
          value !== undefined &&
          (!Number.isInteger(Number(value)) || Number(value) < 0),
      )
    )
      return Response.json(
        { error: "As quantidades devem ser inteiros não negativos." },
        { status: 400 },
      );
    const { name, quantity, minQuantity, unit } = body;

    const result = await sql`
      UPDATE stock_items
      SET
        name = COALESCE(${name ?? null}, name),
        quantity = COALESCE(${quantity ?? null}, quantity),
        min_quantity = COALESCE(${minQuantity ?? null}, min_quantity),
        unit = COALESCE(${unit ?? null}, unit),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return Response.json({ error: "Item não encontrado" }, { status: 404 });
    }

    return Response.json({ item: result[0] });
  } catch (error) {
    console.error("Error updating stock item:", error);
    return Response.json(
      { error: "Erro ao atualizar item de estoque" },
      { status: 500 },
    );
  }
}

// DELETE - Remover item
export async function DELETE(request, { params }) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { id } = params;
    const result =
      await sql`DELETE FROM stock_items WHERE id = ${id} RETURNING id`;

    if (result.length === 0) {
      return Response.json({ error: "Item não encontrado" }, { status: 404 });
    }

    return Response.json({ message: "Item removido com sucesso" });
  } catch (error) {
    console.error("Error deleting stock item:", error);
    return Response.json(
      { error: "Erro ao remover item de estoque" },
      { status: 500 },
    );
  }
}
