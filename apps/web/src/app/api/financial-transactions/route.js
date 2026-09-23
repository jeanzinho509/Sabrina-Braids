import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/admin";

// GET - Listar transações (filtros: type, month, year, paid)
// Também devolve resumo (totais) já calculado, pra alimentar dashboard/financeiro
export async function GET(request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const month = searchParams.get("month"); // 1-12
    const year = searchParams.get("year");
    const paid = searchParams.get("paid"); // "true" | "false"

    let query = `SELECT * FROM financial_transactions WHERE 1=1`;
    const params = [];

    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }
    if (month && year) {
      params.push(year, month);
      query += ` AND EXTRACT(YEAR FROM transaction_date) = $${params.length - 1} AND EXTRACT(MONTH FROM transaction_date) = $${params.length}`;
    }
    if (paid !== null && paid !== undefined && paid !== "") {
      params.push(paid === "true");
      query += ` AND paid = $${params.length}`;
    }

    query += ` ORDER BY transaction_date DESC, created_at DESC`;

    const transactions = await sql(query, params);

    const totalEntradas = transactions
      .filter((t) => t.type === "entrada" && t.paid)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalSaidas = transactions
      .filter((t) => t.type === "saida" && t.paid)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return Response.json({
      transactions,
      summary: {
        totalEntradas,
        totalSaidas,
        saldo: totalEntradas - totalSaidas,
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return Response.json(
      { error: "Erro ao buscar transações" },
      { status: 500 },
    );
  }
}

// POST - Criar nova transação (entrada ou saída)
export async function POST(request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
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
      type,
      category,
      description,
      amount,
      paymentMethod,
      transactionDate,
      appointmentId,
      isRecurring,
      dueDate,
      paid,
    } = body;

    if (!type || !["entrada", "saida"].includes(type)) {
      return Response.json(
        { error: "Tipo inválido (entrada ou saida)" },
        { status: 400 },
      );
    }
    if (
      !category?.trim() ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      return Response.json(
        { error: "Categoria e valor são obrigatórios" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO financial_transactions (
        type, category, description, amount, payment_method,
        transaction_date, appointment_id, is_recurring, due_date, paid
      ) VALUES (
        ${type}, ${category}, ${description || null}, ${amount}, ${paymentMethod || null},
        ${transactionDate || new Date().toISOString().slice(0, 10)}, ${appointmentId || null},
        ${isRecurring || false}, ${dueDate || null}, ${paid !== undefined ? paid : true}
      )
      RETURNING *
    `;

    return Response.json({ transaction: result[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return Response.json({ error: "Erro ao criar transação" }, { status: 500 });
  }
}
