import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/admin";

// GET - Buscar meta de um mês específico (default: mês atual)
export async function GET(request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const year = searchParams.get("year") || now.getFullYear();
    const month = searchParams.get("month") || now.getMonth() + 1;

    const result = await sql`
      SELECT * FROM monthly_goals WHERE year = ${year} AND month = ${month}
    `;

    return Response.json({ goal: result[0] || null });
  } catch (error) {
    console.error("Error fetching monthly goal:", error);
    return Response.json({ error: "Erro ao buscar meta" }, { status: 500 });
  }
}

// POST - Definir/atualizar a meta de um mês (upsert)
export async function POST(request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { year, month, targetAmount } = body;

    if (
      !Number.isInteger(Number(year)) ||
      Number(year) < 2000 ||
      Number(year) > 2200 ||
      !Number.isInteger(Number(month)) ||
      Number(month) < 1 ||
      Number(month) > 12 ||
      !Number.isFinite(Number(targetAmount)) ||
      Number(targetAmount) < 0
    ) {
      return Response.json(
        { error: "Ano, mês e valor da meta são obrigatórios" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO monthly_goals (year, month, target_amount)
      VALUES (${year}, ${month}, ${targetAmount})
      ON CONFLICT (year, month)
      DO UPDATE SET target_amount = ${targetAmount}
      RETURNING *
    `;

    return Response.json({ goal: result[0] });
  } catch (error) {
    console.error("Error setting monthly goal:", error);
    return Response.json({ error: "Erro ao definir meta" }, { status: 500 });
  }
}
