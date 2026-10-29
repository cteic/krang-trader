import { describe, expect, it } from "vitest";

import { priceSeriesSchema } from "./market-data.js";

describe("priceSeriesSchema", () => {
  it("accepts a timestamped positive price series", () => {
    const series = Array.from({ length: 10 }, (_, index) => ({
      price: 100 + index,
      timestamp: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
    }));

    expect(priceSeriesSchema.parse(series)).toEqual(series);
  });

  it("rejects non-positive prices", () => {
    const series = Array.from({ length: 10 }, (_, index) => ({
      price: index === 5 ? 0 : 100 + index,
      timestamp: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
    }));

    expect(() => priceSeriesSchema.parse(series)).toThrow();
  });
});
