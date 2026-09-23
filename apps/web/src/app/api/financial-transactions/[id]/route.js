import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/admin";

// PUT - Atualizar transação (ex: marcar conta como paga)
export async function PUT(request, { params }) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    if (
      body.amount !== undefined &&
      (!Number.isFinite(Number(body.amount)) || Number(body.amount) <= 0)
    )
      return Response.json(
        { error: "Informe um valor maior que zero." },
        { status: 400 },
      );
    const {
      category,
      description,
      amount,
      paymentMethod,
      transactionDate,
      paid,
      dueDate,
    } = body;

    const result = await sql`
      UPDATE financial_transactions
      SET
        category = COALESCE(${category ?? null}, category),
        description = COALESCE(${description ?? null}, description),
        amount = COALESCE(${amount ?? null}, amount),
        payment_method = COALESCE(${paymentMethod ?? null}, payment_method),
        transaction_date = COALESCE(${transactionDate ?? null}, transaction_date),
        due_date = COALESCE(${dueDate ?? null}, due_date),
        paid = COALESCE(${paid ?? null}, paid)
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return Response.json(
        { error: "Transação não encontrada" },
        { status: 404 },
      );
    }

    return Response.json({ transaction: result[0] });
  } catch (error) {
    console.error("Error updating transaction:", error);
    return Response.json(
      { error: "Erro ao atualizar transação" },
      { status: 500 },
    );
  }
}

// DELETE - Remover transação
export async function DELETE(request, { params }) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { id } = params;
    const result =
      await sql`DELETE FROM financial_transactions WHERE id = ${id} RETURNING id`;

    if (result.length === 0) {
      return Response.json(
        { error: "Transação não encontrada" },
        { status: 404 },
      );
    }

    return Response.json({ message: "Transação removida com sucesso" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return Response.json(
      { error: "Erro ao remover transação" },
      { status: 500 },
    );
  }
}
