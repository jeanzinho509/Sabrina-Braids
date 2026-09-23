import { validImage, validVideo } from "@/app/api/utils/media";
import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/admin";

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
