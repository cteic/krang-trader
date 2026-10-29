import { z } from "zod";

import type { PricePoint } from "./market-data.js";

const KRAKEN_STX_USD_DAILY_URL =
  "https://api.kraken.com/0/public/OHLC?pair=STXUSD&interval=1440";

const candleSchema = z.tuple([
  z.number().int().positive(),
  z.string(),
  z.string(),
  z.string(),
  z.string(),
  z.string(),
  z.string(),
  z.number().int().nonnegative(),
]);

const responseSchema = z.object({
  error: z.array(z.string()),
  result: z.record(z.string(), z.unknown()),
});

function parsePositiveNumber(value: string, field: string): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Kraken returned an invalid ${field}`);
  }

  return parsed;
}

function parseKrakenDailyPrices(payload: unknown): PricePoint[] {
  const response = responseSchema.parse(payload);

  if (response.error.length > 0) {
    throw new Error(`Kraken API error: ${response.error.join(", ")}`);
  }

  const candles = z.array(candleSchema).min(2).parse(response.result.STXUSD);

  return candles.slice(0, -1).map((candle) => ({
    price: parsePositiveNumber(candle[4], "closing price"),
    timestamp: new Date(candle[0] * 1_000).toISOString(),
  }));
}

async function fetchKrakenDailyPrices(): Promise<PricePoint[]> {
  const response = await fetch(KRAKEN_STX_USD_DAILY_URL, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(
      `Kraken request failed with status ${String(response.status)}`,
    );
  }

  return parseKrakenDailyPrices(await response.json());
}

export {
  fetchKrakenDailyPrices,
  KRAKEN_STX_USD_DAILY_URL,
  parseKrakenDailyPrices,
};
