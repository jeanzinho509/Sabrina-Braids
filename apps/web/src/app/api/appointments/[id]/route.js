import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/admin";
import { salonDate } from "@/utils/salon";

export async function PATCH(request, { params }) {
  if (!(await requireAdmin()))
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  try {
    const { status, amount } = await request.json();
    if (
      !Number.isInteger(Number(params.id)) ||
      !["pending", "confirmed", "completed", "cancelled"].includes(status)
    )
      return Response.json(
        { error: "Agendamento ou status inválido." },
        { status: 400 },
      );
    const existing =
      await sql`SELECT a.*, s.price FROM appointments a LEFT JOIN services s ON s.id = a.service_id WHERE a.id = ${params.id}`;
    if (!existing.length)
      return Response.json(
        { error: "Agendamento não encontrado." },
        { status: 404 },
      );
    const appointment = existing[0];
    if (
      ["completed", "cancelled"].includes(appointment.status) &&
      status !== appointment.status
    )
      return Response.json(
        { error: "Um atendimento encerrado não pode mudar de status." },
        { status: 409 },
      );
    const value = Number(amount ?? appointment.price);
    if (status === "completed" && (!Number.isFinite(value) || value <= 0))
      return Response.json(
        { error: "Informe o valor recebido para concluir o atendimento." },
        { status: 400 },
      );
    const queries = [
      sql`UPDATE appointments SET status = ${status}, updated_at = NOW() WHERE id = ${params.id} AND (status NOT IN ('completed', 'cancelled') OR status = ${status}) RETURNING *`,
    ];
    if (status === "completed") {
      queries.push(sql`
        INSERT INTO financial_transactions (type, category, description, amount, transaction_date, appointment_id, paid)
        SELECT 'entrada', 'Serviço', COALESCE(s.name, 'Modelo personalizado') || ' - ' || a.client_name,
          ${value}, ${salonDate()}, a.id, true
        FROM appointments a LEFT JOIN services s ON s.id = a.service_id
        WHERE a.id = ${params.id} AND a.status = 'completed'
        ON CONFLICT (appointment_id) WHERE appointment_id IS NOT NULL DO NOTHING
      `);
    }
    const [updated] = await sql.transaction(queries);
    if (!updated.length)
      return Response.json(
        {
          error: "O status mudou. Atualize a agenda antes de tentar novamente.",
        },
        { status: 409 },
      );
    return Response.json({
      appointment: updated[0],
      message: "Status atualizado.",
    });
  } catch (error) {
    if (error.code === "23P01")
      return Response.json(
        { error: "Este horário já está ocupado." },
        { status: 409 },
      );
    console.error("Error updating appointment:", error);
    return Response.json(
      { error: "Não foi possível atualizar o atendimento." },
      { status: 500 },
    );
  }
}
export async function DELETE(request, context) {
  return PATCH(
    new Request(request.url, {
      method: "PATCH",
      headers: request.headers,
      body: JSON.stringify({ status: "cancelled" }),
    }),
    context,
  );
}
