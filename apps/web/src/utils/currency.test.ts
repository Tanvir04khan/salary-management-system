import { describe, expect, it } from "vitest";
import { formatCurrencyAmount } from "./currency";

describe("formatCurrencyAmount", () => {
  it("formats a decimal string without converting the value to a floating-point number", () => {
    expect(formatCurrencyAmount("9007199254740.01", "USD"))
      .toBe("USD 9,007,199,254,740.01");
  });

  it("pads missing fractional digits and handles invalid currency codes safely", () => {
    expect(formatCurrencyAmount("1250", "inr")).toBe("INR 1,250.00");
    expect(formatCurrencyAmount("1250.00", "rupees")).toBe("1250.00 rupees");
  });
});
