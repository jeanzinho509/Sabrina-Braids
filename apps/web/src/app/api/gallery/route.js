import sql from "@/app/api/utils/sql";

// GET - Listar fotos da galeria
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") !== "false";

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
  try {
    const body = await request.json();
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
