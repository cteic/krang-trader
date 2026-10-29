import { describe, expect, it } from "vitest";

import { parseKrakenDailyPrices } from "./kraken-market-data.js";

function candle(timestamp: number, close: string): unknown[] {
  return [timestamp, "1.00", "1.10", "0.90", close, "1.01", "1000", 10];
}

describe("parseKrakenDailyPrices", () => {
  it("normalises committed STX/USD candles and removes the live candle", () => {
    const prices = parseKrakenDailyPrices({
      error: [],
      result: {
        STXUSD: [
          candle(1_700_000_000, "1.25"),
          candle(1_700_086_400, "1.30"),
          candle(1_700_172_800, "1.28"),
        ],
        last: 1_700_086_400,
      },
    });

    expect(prices).toEqual([
      {
        price: 1.25,
        timestamp: new Date(1_700_000_000_000).toISOString(),
      },
      {
        price: 1.3,
        timestamp: new Date(1_700_086_400_000).toISOString(),
      },
    ]);
  });

  it("surfaces errors returned by Kraken", () => {
    expect(() =>
      parseKrakenDailyPrices({
        error: ["EQuery:Unknown asset pair"],
        result: {},
      }),
    ).toThrow("Kraken API error: EQuery:Unknown asset pair");
  });

  it("rejects an invalid closing price", () => {
    expect(() =>
      parseKrakenDailyPrices({
        error: [],
        result: {
          STXUSD: [
            candle(1_700_000_000, "not-a-price"),
            candle(1_700_086_400, "1.30"),
          ],
          last: 1_700_000_000,
        },
      }),
    ).toThrow("Kraken returned an invalid closing price");
  });
});
