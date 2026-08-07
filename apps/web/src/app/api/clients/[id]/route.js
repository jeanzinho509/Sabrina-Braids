import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

const ALLOWED_ADMINS = ["jean.dev.com@gmail.com", "estimesabrina15@gmail.com"];

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return false;
  return ALLOWED_ADMINS.includes(session.user.email.toLowerCase().trim());
}

// GET - Detalhe de um cliente + histórico completo de atendimentos
export async function GET(request, { params }) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { id } = params;

    const clientResult = await sql`SELECT * FROM clients WHERE id = ${id}`;
    if (clientResult.length === 0) {
      return Response.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    const history = await sql`
      SELECT a.*, s.name as service_name, s.price as service_price
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.client_id = ${id}
      ORDER BY a.appointment_date DESC
    `;

    return Response.json({ client: clientResult[0], history });
  } catch (error) {
    console.error("Error fetching client:", error);
    return Response.json({ error: "Erro ao buscar cliente" }, { status: 500 });
  }
}

// PUT - Atualizar cliente
export async function PUT(request, { params }) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { name, phone, email, instagram, birthday, notes } = body;

    if (!name || !phone) {
      return Response.json(
        { error: "Nome e telefone são obrigatórios" },
        { status: 400 },
      );
    }

    const duplicate = await sql`
      SELECT id FROM clients WHERE phone = ${phone} AND id != ${id}
    `;
    if (duplicate.length > 0) {
      return Response.json(
        { error: "Já existe outro cliente com esse telefone" },
        { status: 409 },
      );
    }

    const result = await sql`
      UPDATE clients
      SET name = ${name}, phone = ${phone}, email = ${email || null},
          instagram = ${instagram || null}, birthday = ${birthday || null},
          notes = ${notes || null}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return Response.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    return Response.json({ client: result[0] });
  } catch (error) {
    console.error("Error updating client:", error);
    return Response.json({ error: "Erro ao atualizar cliente" }, { status: 500 });
  }
}

// DELETE - Remover cliente
export async function DELETE(request, { params }) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { id } = params;
    const result = await sql`DELETE FROM clients WHERE id = ${id} RETURNING id`;

    if (result.length === 0) {
      return Response.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    return Response.json({ message: "Cliente removido com sucesso" });
  } catch (error) {
    console.error("Error deleting client:", error);
    return Response.json({ error: "Erro ao remover cliente" }, { status: 500 });
  }
}
