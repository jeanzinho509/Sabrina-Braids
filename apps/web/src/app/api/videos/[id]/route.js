import { validImage, validVideo } from "@/app/api/utils/media";
import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/admin";

export async function DELETE(request, { params }) {
  try {
    if (!(await requireAdmin())) {
      return Response.json({ error: "Não autorizado" }, { status: 403 });
    }
    const { id } = params;
    await sql`UPDATE videos SET active = false WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Erro ao remover vídeo" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    if (!(await requireAdmin())) {
      return Response.json({ error: "Não autorizado" }, { status: 403 });
    }
    const { id } = params;
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

    const { title, video_url, platform, thumbnail_url } = body;

    const result = await sql`
      UPDATE videos SET
        title = COALESCE(${title ?? null}, title),
        video_url = COALESCE(${video_url ?? null}, video_url),
        platform = COALESCE(${platform ?? null}, platform),
        thumbnail_url = COALESCE(${thumbnail_url ?? null}, thumbnail_url)
      WHERE id = ${id}
      RETURNING *
    `;
    return Response.json({ success: true, video: result[0] });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Erro ao atualizar vídeo" }, { status: 500 });
  }
}
