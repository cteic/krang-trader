import { resolve } from "node:path";

import { runBacktest } from "./backtest.js";
import { loadPriceSeries, selectPricePeriod } from "./market-data.js";

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

function requestedPeriodLength(): number | undefined {
  const argument = process.argv.find((value) => value.startsWith("--last="));

  if (!argument) {
    return undefined;
  }

  const value = Number(argument.slice("--last=".length));

  return value;
}

function printTrades(result: ReturnType<typeof runBacktest>): void {
  if (!process.argv.includes("--trades")) {
    return;
  }

  console.log("\nSimulated trades");

  for (const trade of result.trades) {
    console.log(
      [
        trade.timestamp.slice(0, 10),
        trade.action.toUpperCase().padEnd(4),
        `${trade.quantity.toFixed(4)} STX`.padStart(15),
        `at ${formatMoney(trade.price)}`.padStart(12),
        `value ${formatMoney(trade.quantity * trade.price)}`.padStart(16),
        `fee ${formatMoney(trade.fee)}`.padStart(12),
        `allocation ${formatPercentage(trade.allocationAfter)}`.padStart(18),
        trade.reason,
      ].join(" | "),
    );
  }
}

async function main(): Promise<void> {
  const source = resolve(process.argv[2] ?? "data/synthetic-cycle.json");
  const completeSeries = await loadPriceSeries(source);
  const periodLength = requestedPeriodLength();
  const prices = selectPricePeriod(completeSeries, periodLength);
  const result = runBacktest(prices);
  const firstPoint = prices[0];
  const finalPoint = prices.at(-1);

  if (!firstPoint || !finalPoint) {
    throw new Error("The selected evaluation period is empty");
  }

  console.log("Krang Trader offline evaluation");
  console.log(`Source: ${source}`);
  console.log(`Price points: ${String(prices.length)}`);
  console.log(
    `Period: ${firstPoint.timestamp.slice(0, 10)} to ${finalPoint.timestamp.slice(0, 10)}`,
  );
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
  printTrades(result);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unexpected error";
  console.error(message);
  process.exitCode = 1;
});
