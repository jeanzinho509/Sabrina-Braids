import { validImage, validVideo } from "@/app/api/utils/media";
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

// POST - Criar novo serviço
export async function POST(request) {
  try {
    if (!(await requireAdmin())) {
      return Response.json({ error: "Não autorizado" }, { status: 403 });
    }
    const body = await request.json();
    if (body.image_url && !validImage(body.image_url))
      return Response.json(
        { error: "Imagem inválida. Use HTTPS ou JPG, PNG e WebP até 2 MB." },
        { status: 400 },
      );
    if (body.video_url && !validVideo(body.video_url))
      return Response.json(
        { error: "Informe um link HTTPS válido para o vídeo." },
        { status: 400 },
      );
    if (body.thumbnail_url && !validImage(body.thumbnail_url))
      return Response.json({ error: "Capa inválida." }, { status: 400 });
    if (
      (body.price !== undefined &&
        (!Number.isFinite(Number(body.price)) || Number(body.price) <= 0)) ||
      (body.duration_minutes !== undefined &&
        (!Number.isInteger(Number(body.duration_minutes)) ||
          Number(body.duration_minutes) <= 0 ||
          Number(body.duration_minutes) > 720))
    )
      return Response.json(
        { error: "Confira o preço e a duração do serviço." },
        { status: 400 },
      );

    const { name, description, price, duration_minutes, image_url } = body;

    if (!name || !price || !duration_minutes) {
      return Response.json(
        { error: "Nome, preço e duração são obrigatórios" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO services (name, description, price, duration_minutes, image_url)
      VALUES (${name}, ${description || null}, ${price}, ${duration_minutes}, ${image_url || null})
      RETURNING *
    `;

    return Response.json({ success: true, service: result[0] });
  } catch (error) {
    console.error("Error creating service:", error);
    return Response.json({ error: "Erro ao criar serviço" }, { status: 500 });
  }
}
