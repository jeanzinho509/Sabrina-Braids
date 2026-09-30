import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/admin";
import {
  validateProduct,
  validProductId,
  productError,
} from "@/app/api/utils/products";

export async function PATCH(request, { params }) {
  if (!(await requireAdmin()))
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  if (!validProductId(params.id))
    return Response.json({ error: "Produto inválido." }, { status: 400 });
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body))
      return Response.json(
        { error: "Dados do produto inválidos." },
        { status: 400 },
      );
    const existing = await sql`SELECT * FROM products WHERE id = ${params.id}`;
    if (!existing.length)
      return Response.json(
        { error: "Produto não encontrado." },
        { status: 404 },
      );
    const { product, error } = validateProduct({ ...existing[0], ...body });
    if (error) return Response.json({ error }, { status: 400 });
    const {
      name,
      description,
      category,
      price,
      image_url,
      active,
      available,
      display_order,
    } = product;
    const rows =
      await sql`UPDATE products SET name = ${name}, description = ${description}, category = ${category},
      price = ${price}, image_url = ${image_url}, active = ${active}, available = ${available}, display_order = ${display_order}, updated_at = now()
      WHERE id = ${params.id} RETURNING *`;
    if (!rows.length)
      return Response.json(
        { error: "Produto não encontrado." },
        { status: 404 },
      );
    return Response.json({ product: rows[0] });
  } catch (error) {
    return productError(error);
  }
}

// Hide a product without removing its data; it can be published again from admin.
export async function DELETE(request, { params }) {
  if (!(await requireAdmin()))
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  if (!validProductId(params.id))
    return Response.json({ error: "Produto inválido." }, { status: 400 });
  try {
    const rows =
      await sql`UPDATE products SET active = false, updated_at = now() WHERE id = ${params.id} RETURNING id`;
    if (!rows.length)
      return Response.json(
        { error: "Produto não encontrado." },
        { status: 404 },
      );
    return Response.json({ success: true });
  } catch (error) {
    return productError(error);
  }
}
