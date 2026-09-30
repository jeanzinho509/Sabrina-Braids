import { validateService, serviceError } from "@/app/api/utils/services";
import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/admin";

// GET - Listar todos os serviços ativos
export async function GET(request) {
  try {
    const includeInactive =
      new URL(request.url).searchParams.get("active") === "false";
    if (includeInactive && !(await requireAdmin()))
      return Response.json({ error: "Não autorizado" }, { status: 403 });
    const services = await sql`
      SELECT * FROM services
      WHERE (active = true OR ${includeInactive})
      ORDER BY price ASC
    `;

    return Response.json({ services });
  } catch (error) {
    console.error("Error fetching services:", error);
    return Response.json({ error: "Erro ao buscar serviços" }, { status: 500 });
  }
}

export async function POST(request) {
  if (!(await requireAdmin()))
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  try {
    const { service, error } = validateService(await request.json());
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
      await sql`INSERT INTO services (name, description, price, duration_minutes, image_url, image_urls, active)
      VALUES (${name}, ${description}, ${price}, ${duration_minutes}, ${image_url}, ${image_urls}, ${active}) RETURNING *`;
    return Response.json(
      { success: true, service: result[0] },
      { status: 201 },
    );
  } catch (error) {
    return serviceError(error);
  }
}
