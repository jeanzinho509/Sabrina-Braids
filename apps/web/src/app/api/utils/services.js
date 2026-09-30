import { validatePhotos } from "./media";

export function validateService(input, existing = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    return { error: "Dados do serviço inválidos." };
  const value = { ...existing, ...input };
  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (!name || name.length > 160)
    return { error: "Informe um nome de até 160 caracteres." };
  const description = value.description ?? "";
  if (typeof description !== "string" || description.length > 2000)
    return { error: "A descrição deve ter até 2.000 caracteres." };
  const price = Number(value.price),
    duration = Number(value.duration_minutes);
  if (
    !["string", "number"].includes(typeof value.price) ||
    !Number.isFinite(price) ||
    price <= 0 ||
    price > 9999999999.99 ||
    !["string", "number"].includes(typeof value.duration_minutes) ||
    !Number.isInteger(duration) ||
    duration < 1 ||
    duration > 720
  )
    return { error: "Confira o preço e a duração do serviço." };
  const active = value.active ?? true;
  if (typeof active !== "boolean") return { error: "Visibilidade inválida." };
  const photos = validatePhotos(input, existing);
  if (photos.error) return photos;
  return {
    service: {
      name,
      description: description.trim(),
      price,
      duration_minutes: duration,
      active,
      ...photos,
    },
  };
}

export function serviceError(error) {
  if (error instanceof SyntaxError)
    return Response.json(
      { error: "Dados do serviço inválidos." },
      { status: 400 },
    );
  console.error("Services API", error.code);
  return Response.json(
    { error: "Não foi possível salvar o serviço. Tente novamente." },
    { status: 500 },
  );
}
