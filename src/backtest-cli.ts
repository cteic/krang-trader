import { resolve } from "node:path";

import { runBacktest } from "./backtest.js";
import { loadPriceSeries } from "./market-data.js";

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

async function main(): Promise<void> {
  const source = resolve(process.argv[2] ?? "data/synthetic-cycle.json");
  const prices = await loadPriceSeries(source);
  const result = runBacktest(prices);

  console.log("Krang Trader offline evaluation");
  console.log(`Source: ${source}`);
  console.log(`Price points: ${String(prices.length)}`);
  console.log(`Initial value: ${formatMoney(result.initialValue)}`);
  console.log(`Final value: ${formatMoney(result.finalValue)}`);
  console.log(`Strategy return: ${formatPercentage(result.totalReturn)}`);
  console.log(
    `Buy-and-hold return: ${formatPercentage(result.benchmarkReturn)}`,
  );
  console.log(`Excess return: ${formatPercentage(result.excessReturn)}`);
  console.log(`Maximum drawdown: ${formatPercentage(result.maximumDrawdown)}`);
  console.log(`Period volatility: ${formatPercentage(result.volatility)}`);
  console.log(`Trades: ${String(result.tradeCount)}`);
  console.log(`Fees paid: ${formatMoney(result.feesPaid)}`);
  console.log(`Risk halt triggered: ${result.halted ? "yes" : "no"}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unexpected error";
  console.error(message);
  process.exitCode = 1;
});
