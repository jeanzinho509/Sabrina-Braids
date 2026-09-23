import { validImage, validVideo } from "@/app/api/utils/media";
import { requireAdmin } from "@/app/api/utils/admin";
import sql from "@/app/api/utils/sql";

// GET - Listar fotos da galeria
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") !== "false";
    if (!activeOnly && !(await requireAdmin()))
      return Response.json({ error: "Não autorizado" }, { status: 403 });

    let query = "SELECT * FROM gallery";
    const params = [];

    if (activeOnly) {
      query += " WHERE active = $1";
      params.push(true);
    }

    query += " ORDER BY display_order ASC, created_at DESC";

    const gallery = await sql(query, params);

    return Response.json({ success: true, gallery });
  } catch (error) {
    console.error("Error fetching gallery:", error);
    return Response.json(
      { success: false, error: "Erro ao buscar galeria" },
      { status: 500 },
    );
  }
}

// POST - Adicionar nova foto à galeria
export async function POST(request) {
  if (!(await requireAdmin()))
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  try {
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

    const { image_url, caption, display_order } = body;

    if (!image_url) {
      return Response.json(
        { success: false, error: "URL da imagem é obrigatória" },
        { status: 400 },
      );
    }

    const result = await sql(
      "INSERT INTO gallery (image_url, caption, display_order) VALUES ($1, $2, $3) RETURNING *",
      [image_url, caption || null, display_order || 0],
    );

    return Response.json({ success: true, photo: result[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating gallery photo:", error);
    return Response.json(
      { success: false, error: "Erro ao adicionar foto" },
      { status: 500 },
    );
  }
}
