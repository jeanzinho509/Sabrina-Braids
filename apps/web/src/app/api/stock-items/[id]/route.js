import { validProductId } from "@/app/api/utils/products";
import { validateStock } from "@/app/api/utils/stock";
import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/admin";

// PUT - Atualizar item (ex: ajustar quantidade após uso/compra)
export async function PUT(request, { params }) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { id } = params;
    if (!validProductId(id))
      return Response.json({ error: "Item inválido." }, { status: 400 });
    const body = await request.json();
    const validationError = validateStock(body, true);
    if (validationError)
      return Response.json({ error: validationError }, { status: 400 });
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
    if (error instanceof SyntaxError)
      return Response.json(
        { error: "Dados do estoque inválidos." },
        { status: 400 },
      );
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
    if (!validProductId(id))
      return Response.json({ error: "Item inválido." }, { status: 400 });
    const result =
      await sql`DELETE FROM stock_items WHERE id = ${id} RETURNING id`;

    if (result.length === 0) {
      return Response.json({ error: "Item não encontrado" }, { status: 404 });
    }

    return Response.json({ message: "Item removido com sucesso" });
  } catch (error) {
    if (error instanceof SyntaxError)
      return Response.json(
        { error: "Dados do estoque inválidos." },
        { status: 400 },
      );
    console.error("Error deleting stock item:", error);
    return Response.json(
      { error: "Erro ao remover item de estoque" },
      { status: 500 },
    );
  }
}
