export const SALON_TIMEZONE = "America/Sao_Paulo";
export const WHATSAPP_NUMBER = "5521993662669";

export function salonDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SALON_TIMEZONE }).format(
    now,
  );
}

export function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDate(value) {
  if (!value) return "—";
  return String(value).slice(0, 10).split("-").reverse().join("/");
}

export function whatsappLink(message, number = WHATSAPP_NUMBER) {
  const digits = String(number || "").replace(/\D/g, "");
  return `https://wa.me/${digits.length <= 11 ? "55" : ""}${digits}?text=${encodeURIComponent(message)}`;
}

export const appointmentStatuses = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
};
