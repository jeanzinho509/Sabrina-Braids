import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

const ALLOWED_ADMINS = ["jean.dev.com@gmail.com", "estimesabrina15@gmail.com"];

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return false;
  return ALLOWED_ADMINS.includes(session.user.email.toLowerCase().trim());
}

export async function PATCH(request, { params }) {
  try {
    if (!(await requireAdmin())) {
      return Response.json({ error: "Não autorizado" }, { status: 403 });
    }
    const { id } = params;
    const body = await request.json();
    const { name, description, price, duration_minutes, image_url, active } =
      body;

    const setClauses = [];
    const values = [];

    if (name !== undefined) {
      setClauses.push(`name = $${values.length + 1}`);
      values.push(name);
    }
    if (description !== undefined) {
      setClauses.push(`description = $${values.length + 1}`);
      values.push(description);
    }
    if (price !== undefined) {
      setClauses.push(`price = $${values.length + 1}`);
      values.push(price);
    }
    if (duration_minutes !== undefined) {
      setClauses.push(`duration_minutes = $${values.length + 1}`);
      values.push(duration_minutes);
    }
    if (image_url !== undefined) {
      setClauses.push(`image_url = $${values.length + 1}`);
      values.push(image_url);
    }
    if (active !== undefined) {
      setClauses.push(`active = $${values.length + 1}`);
      values.push(active);
    }

    if (setClauses.length === 0) {
      return Response.json(
        { error: "Nenhum campo para atualizar" },
        { status: 400 },
      );
    }

    values.push(id);
    const query = `UPDATE services SET ${setClauses.join(", ")} WHERE id = $${values.length} RETURNING *`;
    const result = await sql(query, values);

    return Response.json({ success: true, service: result[0] });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Erro ao atualizar serviço" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!(await requireAdmin())) {
      return Response.json({ error: "Não autorizado" }, { status: 403 });
    }
    const { id } = params;
    await sql`UPDATE services SET active = false WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Erro ao remover serviço" }, { status: 500 });
  }
}
