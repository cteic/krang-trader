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

export { loadPriceSeries, priceSeriesSchema };
export type { PricePoint };
