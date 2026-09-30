import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/admin";
import { validateProduct, productError } from "@/app/api/utils/products";

export async function GET(request) {
  const includeInactive =
    new URL(request.url).searchParams.get("active") === "false";
  if (includeInactive && !(await requireAdmin()))
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  try {
    const products =
      await sql`SELECT * FROM products WHERE (active = true OR ${includeInactive}) ORDER BY display_order ASC, name ASC, id ASC`;
    return Response.json({ products });
  } catch (error) {
    return productError(error);
  }
}

export async function POST(request) {
  if (!(await requireAdmin()))
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  try {
    const { product, error } = validateProduct(await request.json());
    if (error) return Response.json({ error }, { status: 400 });
    const {
      name,
      description,
      category,
      price,
      image_url,
      image_urls,
      active,
      available,
      display_order,
    } = product;
    const rows =
      await sql`INSERT INTO products (name, description, category, price, image_url, image_urls, active, available, display_order)
      VALUES (${name}, ${description}, ${category}, ${price}, ${image_url}, ${image_urls}, ${active}, ${available}, ${display_order}) RETURNING *`;
    return Response.json({ product: rows[0] }, { status: 201 });
  } catch (error) {
    return productError(error);
  }
}
