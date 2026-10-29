import { describe, expect, it } from "vitest";

import {
  priceSeriesSchema,
  selectPricePeriod,
  type PricePoint,
} from "./market-data.js";

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

describe("selectPricePeriod", () => {
  const prices: PricePoint[] = Array.from({ length: 20 }, (_, index) => ({
    price: index + 1,
    timestamp: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
  }));

  it("selects the latest fixed period", () => {
    expect(selectPricePeriod(prices, 10).map(({ price }) => price)).toEqual([
      11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ]);
  });

  it("rejects periods too short for evaluation", () => {
    expect(() => selectPricePeriod(prices, 9)).toThrow(
      "The --last value must be an integer of at least 10 days",
    );
  });
});
