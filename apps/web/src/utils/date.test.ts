import { describe, expect, it } from "vitest";
import { formatDateOnly, formatDateTime } from "./date";

describe("date formatting", () => {
  it("formats date-only values without applying a local timezone shift", () => {
    expect(formatDateOnly("2025-01-01", "en-US")).toBe("Jan 1, 2025");
    expect(formatDateOnly("2025-02-30", "en-US")).toBe("2025-02-30");
    expect(formatDateOnly(null)).toBe("—");
  });

  it("handles timestamp and invalid date values", () => {
    expect(formatDateTime("not-a-date")).toBe("—");
    expect(formatDateTime(null)).toBe("—");
  });
});
