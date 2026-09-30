import { validateStock } from "@/app/api/utils/stock";
import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/admin";

// GET - Listar itens de estoque
export async function GET() {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const items = await sql`SELECT * FROM stock_items ORDER BY name ASC`;
    return Response.json({ items });
  } catch (error) {
    if (error instanceof SyntaxError)
      return Response.json(
        { error: "Dados do estoque inválidos." },
        { status: 400 },
      );
    console.error("Error fetching stock items:", error);
    return Response.json({ error: "Erro ao buscar estoque" }, { status: 500 });
  }
}

// POST - Criar novo item de estoque
export async function POST(request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validationError = validateStock(body, false);
    if (validationError)
      return Response.json({ error: validationError }, { status: 400 });
    const { name, quantity, minQuantity, unit } = body;

    if (!name) {
      return Response.json(
        { error: "Nome do produto é obrigatório" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO stock_items (name, quantity, min_quantity, unit)
      VALUES (${name}, ${quantity ?? 0}, ${minQuantity ?? 3}, ${unit || "un"})
      RETURNING *
    `;

    return Response.json({ item: result[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError)
      return Response.json(
        { error: "Dados do estoque inválidos." },
        { status: 400 },
      );
    console.error("Error creating stock item:", error);
    return Response.json(
      { error: "Erro ao criar item de estoque" },
      { status: 500 },
    );
  }
}
