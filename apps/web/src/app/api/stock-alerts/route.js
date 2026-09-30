import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/admin";

export async function GET() {
  if (!(await requireAdmin()))
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  try {
    const alerts =
      await sql`SELECT a.stock_item_id, a.triggered_at, a.seen_at, a.version,
      s.name, s.quantity, s.unit, GREATEST(3, s.min_quantity) AS threshold
      FROM stock_alerts a JOIN stock_items s ON s.id = a.stock_item_id
      WHERE a.resolved_at IS NULL ORDER BY a.triggered_at DESC, s.name ASC`;
    return Response.json({
      alerts,
      unread: alerts.filter((alert) => !alert.seen_at).length,
    });
  } catch {
    return Response.json(
      { error: "Não foi possível consultar os avisos de estoque." },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  if (!(await requireAdmin()))
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  try {
    const body = await request.json();
    if (
      !Array.isArray(body?.alerts) ||
      body.alerts.length > 100 ||
      body.alerts.some(
        (item) =>
          !Number.isInteger(item?.id) ||
          item.id < 1 ||
          !Number.isInteger(item?.version) ||
          item.version < 1,
      )
    )
      return Response.json({ error: "Avisos inválidos." }, { status: 400 });
    // Mark only the versions actually shown. A concurrent quantity change stays unread.
    await sql`UPDATE stock_alerts a SET seen_at = NOW()
      FROM jsonb_to_recordset(${JSON.stringify(body.alerts)}::jsonb) AS input(id integer, version integer)
      WHERE a.stock_item_id = input.id AND a.version = input.version AND a.resolved_at IS NULL`;
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: "Não foi possível atualizar os avisos." },
      { status: error instanceof SyntaxError ? 400 : 500 },
    );
  }
}
