import sql from "@/app/api/utils/sql";

// DELETE - Remover foto da galeria
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const result = await sql("DELETE FROM gallery WHERE id = $1 RETURNING *", [
      id,
    ]);

    if (result.length === 0) {
      return Response.json(
        { success: false, error: "Foto não encontrada" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      message: "Foto removida com sucesso",
    });
  } catch (error) {
    console.error("Error deleting gallery photo:", error);
    return Response.json(
      { success: false, error: "Erro ao remover foto" },
      { status: 500 },
    );
  }
}

// PATCH - Atualizar foto da galeria
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { caption, display_order, active, image_url } = body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (image_url !== undefined) {
      updates.push(`image_url = $${paramCount}`);
      values.push(image_url);
      paramCount++;
    }

    if (caption !== undefined) {
      updates.push(`caption = $${paramCount}`);
      values.push(caption);
      paramCount++;
    }

    if (display_order !== undefined) {
      updates.push(`display_order = $${paramCount}`);
      values.push(display_order);
      paramCount++;
    }

    if (active !== undefined) {
      updates.push(`active = $${paramCount}`);
      values.push(active);
      paramCount++;
    }

    if (updates.length === 0) {
      return Response.json(
        { success: false, error: "Nenhum campo para atualizar" },
        { status: 400 },
      );
    }

    values.push(id);
    const query = `UPDATE gallery SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`;

    const result = await sql(query, values);

    if (result.length === 0) {
      return Response.json(
        { success: false, error: "Foto não encontrada" },
        { status: 404 },
      );
    }

    return Response.json({ success: true, photo: result[0] });
  } catch (error) {
    console.error("Error updating gallery photo:", error);
    return Response.json(
      { success: false, error: "Erro ao atualizar foto" },
      { status: 500 },
    );
  }
}
