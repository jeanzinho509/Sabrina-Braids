import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

const ALLOWED_ADMINS = ["jean.dev.com@gmail.com", "estimesabrina15@gmail.com"];

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return false;
  return ALLOWED_ADMINS.includes(session.user.email.toLowerCase().trim());
}

// PUT - Atualizar transação (ex: marcar conta como paga)
export async function PUT(request, { params }) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { category, description, amount, paymentMethod, transactionDate, paid, dueDate } = body;

    const result = await sql`
      UPDATE financial_transactions
      SET
        category = COALESCE(${category}, category),
        description = COALESCE(${description}, description),
        amount = COALESCE(${amount}, amount),
        payment_method = COALESCE(${paymentMethod}, payment_method),
        transaction_date = COALESCE(${transactionDate}, transaction_date),
        due_date = COALESCE(${dueDate}, due_date),
        paid = COALESCE(${paid}, paid)
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return Response.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    return Response.json({ transaction: result[0] });
  } catch (error) {
    console.error("Error updating transaction:", error);
    return Response.json({ error: "Erro ao atualizar transação" }, { status: 500 });
  }
}

// DELETE - Remover transação
export async function DELETE(request, { params }) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { id } = params;
    const result = await sql`DELETE FROM financial_transactions WHERE id = ${id} RETURNING id`;

    if (result.length === 0) {
      return Response.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    return Response.json({ message: "Transação removida com sucesso" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return Response.json({ error: "Erro ao remover transação" }, { status: 500 });
  }
}
