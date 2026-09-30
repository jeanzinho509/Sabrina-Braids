export function validateStock(input, partial = false) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    return "Dados do estoque inválidos.";
  if (
    (!partial || input.name !== undefined) &&
    (typeof input.name !== "string" ||
      !input.name.trim() ||
      input.name.length > 160)
  )
    return "Informe um nome de até 160 caracteres.";
  if (
    input.unit !== undefined &&
    (typeof input.unit !== "string" ||
      !input.unit.trim() ||
      input.unit.length > 20)
  )
    return "Informe uma unidade de até 20 caracteres.";
  if (
    [input.quantity, input.minQuantity].some(
      (value) =>
        value !== undefined &&
        (!["number", "string"].includes(typeof value) ||
          !String(value).trim() ||
          !Number.isInteger(Number(value)) ||
          Number(value) < 0 ||
          Number(value) > 2147483647),
    )
  )
    return "As quantidades devem ser números inteiros não negativos.";
  return null;
}
