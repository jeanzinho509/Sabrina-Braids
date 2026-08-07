import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

const ALLOWED_ADMINS = ["jean.dev.com@gmail.com", "estimesabrina15@gmail.com"];

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return false;
  return ALLOWED_ADMINS.includes(session.user.email.toLowerCase().trim());
}

// GET - Resumo completo pro Dashboard: clientes de hoje, faturamento de hoje,
// meta do mês, tarefas prioritárias, estoque baixo e contas a vencer.
export async function GET() {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const [
      todayAppointments,
      todayRevenue,
      priorityTasks,
      lowStock,
      upcomingBills,
      monthlyGoal,
      monthRevenue,
    ] = await Promise.all([
      sql`
        SELECT COUNT(*) as count FROM appointments
        WHERE appointment_date = ${today} AND status != 'cancelled'
      `,
      sql`
        SELECT COALESCE(SUM(amount), 0) as total FROM financial_transactions
        WHERE type = 'entrada' AND transaction_date = ${today}
      `,
      sql`
        SELECT * FROM tasks WHERE priority = true AND done = false
        ORDER BY created_at ASC LIMIT 5
      `,
      sql`
        SELECT * FROM stock_items WHERE quantity <= min_quantity ORDER BY quantity ASC
      `,
      sql`
        SELECT * FROM financial_transactions
        WHERE type = 'saida' AND paid = false AND due_date IS NOT NULL
        ORDER BY due_date ASC LIMIT 5
      `,
      sql`
        SELECT * FROM monthly_goals WHERE year = ${year} AND month = ${month}
      `,
      sql`
        SELECT COALESCE(SUM(amount), 0) as total FROM financial_transactions
        WHERE type = 'entrada'
        AND EXTRACT(YEAR FROM transaction_date) = ${year}
        AND EXTRACT(MONTH FROM transaction_date) = ${month}
      `,
    ]);

    const target = monthlyGoal[0]?.target_amount ? Number(monthlyGoal[0].target_amount) : 0;
    const current = Number(monthRevenue[0].total);
    const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

    return Response.json({
      todayClients: Number(todayAppointments[0].count),
      todayRevenue: Number(todayRevenue[0].total),
      priorityTasks,
      lowStock,
      upcomingBills,
      goal: { target, current, percent },
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return Response.json({ error: "Erro ao buscar resumo do dashboard" }, { status: 500 });
  }
}
