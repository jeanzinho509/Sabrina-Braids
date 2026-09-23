import { validImage, validVideo } from "@/app/api/utils/media";
import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/admin";

export async function GET() {
  try {
    const videos = await sql`
      SELECT * FROM videos 
      WHERE active = true 
      ORDER BY display_order ASC, created_at DESC
    `;
    return Response.json({ success: true, videos });
  } catch (error) {
    console.error(error);
    return Response.json(
      { success: false, error: "Erro ao buscar vídeos" },
      { status: 500 },
    );
  }
}

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

    const { title, video_url, platform, thumbnail_url, display_order } = body;

    if (!video_url) {
      return Response.json(
        { error: "URL do vídeo é obrigatória" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO videos (title, video_url, platform, thumbnail_url, display_order)
      VALUES (${title || null}, ${video_url}, ${platform || "other"}, ${thumbnail_url || null}, ${display_order || 0})
      RETURNING *
    `;

    return Response.json({ success: true, video: result[0] });
  } catch (error) {
    console.error(error);
    return Response.json(
      { success: false, error: "Erro ao criar vídeo" },
      { status: 500 },
    );
  }
}
