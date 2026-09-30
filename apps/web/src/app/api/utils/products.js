import { validatePhotos } from "./media";

export function validateProduct(input, existing = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    return { error: "Dados do produto inválidos." };
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const description = input.description ?? "";
  const category = input.category ?? "Cuidados capilares";
  if (!name || name.length > 160)
    return { error: "Informe o nome do produto, com até 160 caracteres." };
  if (typeof description !== "string" || description.length > 2000)
    return { error: "A descrição deve ter até 2.000 caracteres." };
  if (typeof category !== "string" || !category.trim() || category.length > 80)
    return { error: "Informe uma categoria com até 80 caracteres." };
  const rawPrice = input.price;
  const price =
    rawPrice === null || rawPrice === undefined || rawPrice === ""
      ? null
      : Number(rawPrice);
  if (
    price !== null &&
    (!["number", "string"].includes(typeof rawPrice) ||
      !Number.isFinite(price) ||
      price <= 0 ||
      price > 9999999999.99)
  )
    return {
      error: "Informe um preço válido ou deixe em branco para consulta.",
    };
  const active = input.active ?? false;
  const available = input.available ?? true;
  if (typeof active !== "boolean" || typeof available !== "boolean")
    return { error: "Disponibilidade ou visibilidade inválida." };
  const {
    image_url,
    image_urls,
    error: photoError,
  } = validatePhotos(input, existing);
  if (photoError) return { error: photoError };
  if (active && !image_url)
    return { error: "Adicione uma foto antes de exibir o produto no site." };
  const display_order = input.display_order ?? 0;
  if (
    !Number.isInteger(display_order) ||
    display_order < 0 ||
    display_order > 100000
  )
    return {
      error: "A ordem de exibição deve ser um número inteiro de 0 a 100.000.",
    };
  return {
    product: {
      name,
      description: description.trim(),
      category: category.trim(),
      price,
      image_url: image_url || null,
      image_urls,
      active,
      available,
      display_order,
    },
  };
}

export function productError(error) {
  if (error instanceof SyntaxError)
    return Response.json(
      { error: "Dados do produto inválidos." },
      { status: 400 },
    );
  console.error("Products API:", error);
  return Response.json(
    { error: "Não foi possível acessar os produtos. Tente novamente." },
    { status: 500 },
  );
}

export function validProductId(id) {
  return (
    /^\d+$/.test(String(id)) &&
    Number.isSafeInteger(Number(id)) &&
    Number(id) > 0 &&
    Number(id) <= 2147483647
  );
}
