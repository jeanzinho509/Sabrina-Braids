import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

const ALLOWED_ADMINS = ["jean.dev.com@gmail.com", "estimesabrina15@gmail.com"];

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return false;
  return ALLOWED_ADMINS.includes(session.user.email.toLowerCase().trim());
}

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
