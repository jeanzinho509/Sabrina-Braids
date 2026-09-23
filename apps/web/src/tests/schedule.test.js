// @vitest-environment node
import { describe, it, expect } from "vitest";
import { availableSlots, validDate } from "@/app/api/utils/schedule";
const now = new Date("2026-09-20T13:15:00Z"); // 10:15 in Rio

describe("availability in the salon's timezone", () => {
  it("closes Saturdays and opens Sundays", () => {
    expect(availableSlots("2026-09-26", 60, [], now)).toEqual([]);
    expect(availableSlots("2026-09-27", 60, [], now)[0].start).toBe("07:00");
  });
  it("never offers past slots and respects Friday closing", () => {
    expect(availableSlots("2026-09-19", 60, [], now)).toEqual([]);
    expect(availableSlots("2026-09-20", 60, [], now)[0].start).toBe("10:30");
    expect(availableSlots("2026-09-25", 300, [], now).at(-1)).toMatchObject({
      start: "12:00",
      end: "17:00",
    });
  });
  it("allows touching boundaries, blocks overlaps and handles Postgres seconds", () => {
    const slots = availableSlots(
      "2026-09-21",
      60,
      [{ start_time: "09:00:00", end_time: "10:00:00" }],
      now,
    ).map((slot) => slot.start);
    expect(slots).toContain("08:00");
    expect(slots).toContain("10:00");
    expect(slots).not.toContain("08:30");
    expect(slots).not.toContain("09:00");
  });
  it("rejects invalid dates and durations", () => {
    expect(validDate("2026-02-30")).toBe(false);
    for (const duration of [-1, 0, 721, 1.5])
      expect(availableSlots("2026-09-21", duration, [], now)).toEqual([]);
  });
});
