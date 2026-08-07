import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

const ALLOWED_ADMINS = ["jean.dev.com@gmail.com", "estimesabrina15@gmail.com"];

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return false;
  return ALLOWED_ADMINS.includes(session.user.email.toLowerCase().trim());
}

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
