import { salonDate, SALON_TIMEZONE } from "@/utils/salon";

export const toMinutes = (time) => {
  const [hours, minutes] = String(time).split(":").map(Number);
  return hours * 60 + minutes;
};
export const toTime = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
export const validDate = (date) =>
  typeof date === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  !Number.isNaN(Date.parse(date)) &&
  new Date(date).toISOString().slice(0, 10) === date;
export const validTime = (time) =>
  typeof time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

export function availableSlots(
  date,
  duration,
  occupied = [],
  now = new Date(),
) {
  if (
    !validDate(date) ||
    !Number.isInteger(duration) ||
    duration <= 0 ||
    duration > 720 ||
    date < salonDate(now)
  )
    return [];
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (weekday === 6) return [];
  const [start, end] = weekday === 5 ? [480, 1020] : [420, 1140];
  const currentTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: SALON_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
  const slots = [];
  for (let minute = start; minute + duration <= end; minute += 30) {
    if (date === salonDate(now) && minute <= toMinutes(currentTime)) continue;
    if (
      occupied.some(
        (slot) =>
          minute < toMinutes(slot.end_time) &&
          minute + duration > toMinutes(slot.start_time),
      )
    )
      continue;
    slots.push({
      start: toTime(minute),
      end: toTime(minute + duration),
      display: toTime(minute),
    });
  }
  return slots;
}
