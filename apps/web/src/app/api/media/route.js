import { randomUUID } from "node:crypto";
import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/admin";
import { decodeImage } from "@/app/api/utils/media";

export async function POST(request) {
  if (!(await requireAdmin()))
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  try {
    const input = await request.json();
    const image = decodeImage(input?.image);
    if (!image)
      return Response.json(
        { error: "Envie uma foto JPG, PNG ou WebP válida de até 2 MB." },
        { status: 400 },
      );
    const id = randomUUID();
    await sql`INSERT INTO media_assets (id, mime_type, content) VALUES (${id}, ${image.mimeType}, decode(${image.base64}, 'base64'))`;
    return Response.json({ url: `/api/media/${id}` }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError)
      return Response.json({ error: "Imagem inválida." }, { status: 400 });
    console.error("Media upload failed", error.code);
    return Response.json(
      { error: "Não foi possível salvar a foto. Tente novamente." },
      { status: 500 },
    );
  }
}
