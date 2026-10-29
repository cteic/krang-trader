import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  fetchKrakenDailyPrices,
  KRAKEN_STX_USD_DAILY_URL,
} from "./kraken-market-data.js";

async function main(): Promise<void> {
  const prices = await fetchKrakenDailyPrices();
  const firstPoint = prices[0];
  const finalPoint = prices.at(-1);

  if (!firstPoint || !finalPoint) {
    throw new Error("Kraken returned no committed STX/USD prices");
  }

  const finalDate = finalPoint.timestamp.slice(0, 10);
  const destination = resolve(
    process.argv[2] ?? `data/stx-usd-daily-${finalDate}.json`,
  );
  await writeFile(destination, `${JSON.stringify(prices, null, 2)}\n`, "utf8");

  console.log("Recorded Kraken STX/USD daily market data");
  console.log(`Source: ${KRAKEN_STX_USD_DAILY_URL}`);
  console.log(`Destination: ${destination}`);
  console.log(`Price points: ${String(prices.length)}`);
  console.log(`First candle: ${firstPoint.timestamp}`);
  console.log(`Final candle: ${finalPoint.timestamp}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unexpected error";
  console.error(message);
  process.exitCode = 1;
});
