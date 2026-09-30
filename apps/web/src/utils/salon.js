export const SALON_TIMEZONE = "America/Sao_Paulo";
export const SALON_ADDRESS = {
  street: "Rua Carlos Palut, 230",
  complement: "Galeria da Merck, Box 10",
  postalCode: "22710-310",
};
export const SALON_HOURS = {
  regular: { start: "09:30", end: "16:00" },
  friday: { start: "09:30", end: "14:30" },
};
export function hoursForWeekday(weekday) {
  return weekday === 6
    ? null
    : weekday === 5
      ? SALON_HOURS.friday
      : SALON_HOURS.regular;
}
const hourLabel = (value) =>
  value.endsWith(":00") ? value.replace(":00", "h") : value.replace(":", "h");
export const SALON_HOURS_LABELS = [
  `Domingo a quinta: ${hourLabel(SALON_HOURS.regular.start)} às ${hourLabel(SALON_HOURS.regular.end)}`,
  `Sexta-feira: ${hourLabel(SALON_HOURS.friday.start)} às ${hourLabel(SALON_HOURS.friday.end)}`,
  "Sábado: fechado",
];
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
