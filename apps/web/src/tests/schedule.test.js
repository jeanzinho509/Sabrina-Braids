// @vitest-environment node
import { describe, it, expect } from "vitest";
import { availableSlots, validDate } from "@/app/api/utils/schedule";
const now = new Date("2026-09-20T13:15:00Z"); // 10:15 in Rio

describe("availability in the salon's timezone", () => {
  it("closes Saturdays and opens Sundays", () => {
    expect(availableSlots("2026-09-26", 60, [], now)).toEqual([]);
    expect(availableSlots("2026-09-27", 60, [], now)[0].start).toBe("09:30");
  });
  it("never offers past slots and respects Friday closing", () => {
    expect(availableSlots("2026-09-19", 60, [], now)).toEqual([]);
    expect(availableSlots("2026-09-20", 60, [], now)[0].start).toBe("10:30");
    expect(availableSlots("2026-09-25", 300, [], now).at(-1)).toMatchObject({
      start: "09:30",
      end: "14:30",
    });
  });
  it("allows touching boundaries, blocks overlaps and handles Postgres seconds", () => {
    const slots = availableSlots(
      "2026-09-21",
      60,
      [{ start_time: "10:30:00", end_time: "11:30:00" }],
      now,
    ).map((slot) => slot.start);
    expect(slots).toContain("09:30");
    expect(slots).toContain("11:30");
    expect(slots).not.toContain("10:00");
    expect(slots).not.toContain("10:30");
  });
  it("finishes by 16:00 Sunday through Thursday and 14:30 Friday", () => {
    for (const date of [
      "2026-09-21",
      "2026-09-22",
      "2026-09-23",
      "2026-09-24",
      "2026-09-27",
    ]) {
      const slots = availableSlots(date, 60, [], now);
      expect(slots[0]).toMatchObject({ start: "09:30", end: "10:30" });
      expect(slots.at(-1)).toMatchObject({ start: "15:00", end: "16:00" });
      expect(availableSlots(date, 391, [], now)).toEqual([]);
    }
    expect(availableSlots("2026-09-25", 60, [], now).at(-1)).toMatchObject({
      start: "13:30",
      end: "14:30",
    });
    expect(availableSlots("2026-09-25", 301, [], now)).toEqual([]);
  });
  it("rejects invalid dates and durations", () => {
    expect(validDate("2026-02-30")).toBe(false);
    for (const duration of [-1, 0, 721, 1.5])
      expect(availableSlots("2026-09-21", duration, [], now)).toEqual([]);
  });
});
