import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/admin";
import { validProductId } from "@/app/api/utils/products";
import { validateService, serviceError } from "@/app/api/utils/services";

export async function PATCH(request, { params }) {
  if (!(await requireAdmin()))
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  if (!validProductId(params.id))
    return Response.json({ error: "Serviço inválido." }, { status: 400 });
  try {
    const body = await request.json();
    const existing = await sql`SELECT * FROM services WHERE id = ${params.id}`;
    if (!existing.length)
      return Response.json(
        { error: "Serviço não encontrado." },
        { status: 404 },
      );
    const { service, error } = validateService(body, existing[0]);
    if (error) return Response.json({ error }, { status: 400 });
    const {
      name,
      description,
      price,
      duration_minutes,
      image_url,
      image_urls,
      active,
    } = service;
    const result =
      await sql`UPDATE services SET name=${name}, description=${description}, price=${price},
      duration_minutes=${duration_minutes}, image_url=${image_url}, image_urls=${image_urls}, active=${active}
      WHERE id=${params.id} RETURNING *`;
    return Response.json({ success: true, service: result[0] });
  } catch (error) {
    return serviceError(error);
  }
}

export async function DELETE(request, { params }) {
  if (!(await requireAdmin()))
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  if (!validProductId(params.id))
    return Response.json({ error: "Serviço inválido." }, { status: 400 });
  try {
    const rows =
      await sql`UPDATE services SET active=false WHERE id=${params.id} RETURNING id`;
    if (!rows.length)
      return Response.json(
        { error: "Serviço não encontrado." },
        { status: 404 },
      );
    return Response.json({ success: true });
  } catch (error) {
    return serviceError(error);
  }
}
