import { describe, expect, it } from "vitest";

import { DEFAULT_BACKTEST_OPTIONS, runBacktest } from "./backtest.js";
import type { PricePoint } from "./market-data.js";

function createSeries(prices: number[]): PricePoint[] {
  return prices.map((price, index) => ({
    price,
    timestamp: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
  }));
}

describe("runBacktest", () => {
  it("trades a rising momentum series and records its costs", () => {
    const result = runBacktest(
      createSeries([
        100, 100, 101, 101, 102, 103, 105, 108, 111, 114, 117, 120,
      ]),
    );

    expect(result.tradeCount).toBeGreaterThan(0);
    expect(result.feesPaid).toBeGreaterThan(0);
    expect(result.finalValue).toBeGreaterThan(result.initialValue);
    expect(result.halted).toBe(false);
  });

  it("does not trade when confidence is below the configured floor", () => {
    const result = runBacktest(
      createSeries([
        100, 100, 100, 100, 100, 100, 103, 103, 103, 103, 103, 103,
      ]),
      { ...DEFAULT_BACKTEST_OPTIONS, minimumConfidence: 1 },
    );

    expect(result.tradeCount).toBe(0);
  });

  it("caps asset exposure after each simulated purchase", () => {
    const result = runBacktest(
      createSeries([
        100, 100, 101, 101, 102, 103, 105, 108, 111, 114, 117, 120,
      ]),
      { ...DEFAULT_BACKTEST_OPTIONS, maximumBuyAllocation: 0.5 },
    );

    expect(result.trades.length).toBeGreaterThan(0);
    expect(
      result.trades
        .filter(({ action }) => action === "buy")
        .every(({ allocationAfter }) => allocationAfter <= 0.500_000_1),
    ).toBe(true);
  });

  it("does not create orders below the minimum trade value", () => {
    const result = runBacktest(
      createSeries([
        100, 100, 101, 101, 102, 103, 105, 108, 111, 114, 117, 120,
      ]),
      { ...DEFAULT_BACKTEST_OPTIONS, minimumTradeValue: 3_000 },
    );

    expect(result.tradeCount).toBe(0);
  });

  it("halts after the portfolio breaches its maximum drawdown", () => {
    const result = runBacktest(
      createSeries([
        100, 101, 102, 104, 108, 112, 116, 120, 100, 80, 60, 50, 45,
      ]),
      {
        ...DEFAULT_BACKTEST_OPTIONS,
        maximumDrawdown: 0.05,
        positionFraction: 1,
      },
    );

    expect(result.halted).toBe(true);
    expect(result.maximumDrawdown).toBeGreaterThanOrEqual(0.05);
    expect(result.trades.at(-1)?.action).toBe("sell");
    expect(result.trades.at(-1)?.reason).toContain("liquidating");
  });

  it("rejects window settings that cannot form a baseline", () => {
    expect(() =>
      runBacktest(
        createSeries([100, 101, 102, 103, 104, 105, 106, 107, 108, 109]),
        {
          ...DEFAULT_BACKTEST_OPTIONS,
          longWindowSize: 3,
          shortWindowSize: 3,
        },
      ),
    ).toThrow("Long window must be larger than the short window");
  });

  it("rejects price points that are not chronological", () => {
    const series = createSeries([
      100, 101, 102, 103, 104, 105, 106, 107, 108, 109,
    ]);
    const secondPoint = series[1];

    if (!secondPoint) {
      throw new Error("Expected a second price point");
    }

    secondPoint.timestamp = series[0]?.timestamp ?? "";

    expect(() => runBacktest(series)).toThrow(
      "Price points must have unique chronological timestamps",
    );
  });
});
