import { readFile } from "node:fs/promises";

import { z } from "zod";

interface PricePoint {
  price: number;
  timestamp: string;
}

const pricePointSchema: z.ZodType<PricePoint> = z.object({
  price: z.number().positive(),
  timestamp: z.iso.datetime(),
});

const priceSeriesSchema = z.array(pricePointSchema).min(10);

async function loadPriceSeries(path: string): Promise<PricePoint[]> {
  const contents = await readFile(path, "utf8");
  return priceSeriesSchema.parse(JSON.parse(contents));
}

function selectPricePeriod(
  prices: PricePoint[],
  periodLength?: number,
): PricePoint[] {
  if (periodLength === undefined) {
    return prices;
  }

  if (!Number.isInteger(periodLength) || periodLength < 10) {
    throw new Error("The --last value must be an integer of at least 10 days");
  }

  return prices.slice(-periodLength);
}

export { loadPriceSeries, priceSeriesSchema, selectPricePeriod };
export type { PricePoint };
