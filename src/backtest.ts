import type { PricePoint } from "./market-data.js";
import { ACTIONS, evaluateMomentum } from "./strategy.js";

interface BacktestOptions {
  feeRate: number;
  initialCash: number;
  longWindowSize: number;
  maximumBuyAllocation: number;
  maximumDrawdown: number;
  minimumConfidence: number;
  minimumDifference: number;
  minimumTradeValue: number;
  positionFraction: number;
  shortWindowSize: number;
}

interface SimulatedTrade {
  action: typeof ACTIONS.buy | typeof ACTIONS.sell;
  allocationAfter: number;
  fee: number;
  price: number;
  quantity: number;
  reason: string;
  timestamp: string;
}

interface BacktestResult {
  benchmarkReturn: number;
  excessReturn: number;
  feesPaid: number;
  finalValue: number;
  halted: boolean;
  initialValue: number;
  maximumDrawdown: number;
  totalReturn: number;
  tradeCount: number;
  trades: SimulatedTrade[];
  volatility: number;
}

interface Portfolio {
  asset: number;
  cash: number;
}

const DEFAULT_BACKTEST_OPTIONS: BacktestOptions = {
  feeRate: 0.001,
  initialCash: 10_000,
  longWindowSize: 8,
  maximumBuyAllocation: 0.75,
  maximumDrawdown: 0.12,
  minimumConfidence: 0.7,
  minimumDifference: 0.015,
  minimumTradeValue: 25,
  positionFraction: 0.25,
  shortWindowSize: 3,
};

function validateOptions(options: BacktestOptions): void {
  if (!Number.isFinite(options.initialCash) || options.initialCash <= 0) {
    throw new Error("Initial cash must be a positive finite value");
  }

  if (
    options.shortWindowSize < 1 ||
    options.longWindowSize <= options.shortWindowSize
  ) {
    throw new Error("Long window must be larger than the short window");
  }

  if (
    !Number.isInteger(options.shortWindowSize) ||
    !Number.isInteger(options.longWindowSize)
  ) {
    throw new Error("Window sizes must be integers");
  }

  if (
    !Number.isFinite(options.minimumDifference) ||
    options.minimumDifference <= 0
  ) {
    throw new Error("Minimum difference must be a positive finite value");
  }

  if (
    !Number.isFinite(options.minimumTradeValue) ||
    options.minimumTradeValue <= 0
  ) {
    throw new Error("Minimum trade value must be a positive finite value");
  }

  const fractions = [
    options.feeRate,
    options.maximumBuyAllocation,
    options.maximumDrawdown,
    options.minimumConfidence,
    options.positionFraction,
  ];

  if (
    fractions.some((value) => !Number.isFinite(value) || value < 0 || value > 1)
  ) {
    throw new Error("Risk settings must be finite values between zero and one");
  }

  if (options.feeRate === 1) {
    throw new Error("Fee rate must be less than one");
  }

  if (
    options.maximumBuyAllocation === 0 ||
    options.maximumDrawdown === 0 ||
    options.positionFraction === 0
  ) {
    throw new Error(
      "Allocation, drawdown and order limits must be greater than zero",
    );
  }
}

function validatePrices(prices: PricePoint[]): void {
  let previousTimestamp = Number.NEGATIVE_INFINITY;

  for (const point of prices) {
    const timestamp = Date.parse(point.timestamp);

    if (!Number.isFinite(point.price) || point.price <= 0) {
      throw new Error("Prices must be positive finite values");
    }

    if (!Number.isFinite(timestamp) || timestamp <= previousTimestamp) {
      throw new Error("Price points must have unique chronological timestamps");
    }

    previousTimestamp = timestamp;
  }
}

function portfolioValue(portfolio: Portfolio, price: number): number {
  return portfolio.cash + portfolio.asset * price;
}

function calculateVolatility(values: number[]): number {
  if (values.length < 2) {
    return 0;
  }

  const returns = values.slice(1).map((value, index) => {
    const previous = values[index];

    if (previous === undefined || previous === 0) {
      throw new Error("Portfolio values must be non-zero");
    }

    return value / previous - 1;
  });
  const mean =
    returns.reduce((total, value) => total + value, 0) / returns.length;
  const variance =
    returns.reduce((total, value) => total + (value - mean) ** 2, 0) /
    returns.length;

  return Math.sqrt(variance);
}

function runBacktest(
  prices: PricePoint[],
  options: BacktestOptions = DEFAULT_BACKTEST_OPTIONS,
): BacktestResult {
  validateOptions(options);
  validatePrices(prices);

  if (prices.length < options.longWindowSize + 1) {
    throw new Error("Price series is too short for the configured windows");
  }

  const firstPoint = prices[0];
  const finalPoint = prices.at(-1);

  if (!firstPoint || !finalPoint) {
    throw new Error("Price series cannot be empty");
  }

  const portfolio: Portfolio = { asset: 0, cash: options.initialCash };
  const trades: SimulatedTrade[] = [];
  const values: number[] = [options.initialCash];
  let feesPaid = 0;
  let halted = false;
  let maximumDrawdown = 0;
  let peakValue = options.initialCash;

  for (
    let index = options.longWindowSize - 1;
    index < prices.length;
    index += 1
  ) {
    const point = prices[index];

    if (!point) {
      throw new Error("Price series contains a missing point");
    }

    const valueBeforeDecision = portfolioValue(portfolio, point.price);
    peakValue = Math.max(peakValue, valueBeforeDecision);
    const drawdown = (peakValue - valueBeforeDecision) / peakValue;
    maximumDrawdown = Math.max(maximumDrawdown, drawdown);

    if (drawdown >= options.maximumDrawdown) {
      halted = true;

      if (portfolio.asset > 0) {
        const quantity = portfolio.asset;
        const grossProceeds = quantity * point.price;
        const fee = grossProceeds * options.feeRate;
        portfolio.asset = 0;
        portfolio.cash += grossProceeds - fee;
        feesPaid += fee;
        trades.push({
          action: ACTIONS.sell,
          allocationAfter: 0,
          fee,
          price: point.price,
          quantity,
          reason:
            "Maximum drawdown breached; liquidating the simulated position",
          timestamp: point.timestamp,
        });
      }
    }

    if (!halted) {
      const shortWindow = prices
        .slice(index - options.shortWindowSize + 1, index + 1)
        .map(({ price }) => price);
      const longWindow = prices
        .slice(index - options.longWindowSize + 1, index + 1)
        .map(({ price }) => price);
      const decision = evaluateMomentum(
        { currentPrice: point.price, longWindow, shortWindow },
        { minimumDifference: options.minimumDifference },
      );

      if (
        decision.confidence >= options.minimumConfidence &&
        decision.action === ACTIONS.buy
      ) {
        const currentValue = portfolioValue(portfolio, point.price);
        const currentAssetValue = portfolio.asset * point.price;
        const remainingCapacity = Math.max(
          currentValue * options.maximumBuyAllocation - currentAssetValue,
          0,
        );
        const capacitySpend =
          remainingCapacity /
          (1 -
            options.feeRate +
            options.maximumBuyAllocation * options.feeRate);
        const spend = Math.min(
          portfolio.cash * options.positionFraction,
          capacitySpend,
        );

        if (spend >= options.minimumTradeValue) {
          const fee = spend * options.feeRate;
          const quantity = (spend - fee) / point.price;
          portfolio.cash -= spend;
          portfolio.asset += quantity;
          feesPaid += fee;
          trades.push({
            action: ACTIONS.buy,
            allocationAfter:
              (portfolio.asset * point.price) /
              portfolioValue(portfolio, point.price),
            fee,
            price: point.price,
            quantity,
            reason: decision.reason,
            timestamp: point.timestamp,
          });
        }
      }

      if (
        decision.confidence >= options.minimumConfidence &&
        decision.action === ACTIONS.sell
      ) {
        const quantity = portfolio.asset * options.positionFraction;

        const grossProceeds = quantity * point.price;

        if (grossProceeds >= options.minimumTradeValue) {
          const fee = grossProceeds * options.feeRate;
          portfolio.asset -= quantity;
          portfolio.cash += grossProceeds - fee;
          feesPaid += fee;
          trades.push({
            action: ACTIONS.sell,
            allocationAfter:
              (portfolio.asset * point.price) /
              portfolioValue(portfolio, point.price),
            fee,
            price: point.price,
            quantity,
            reason: decision.reason,
            timestamp: point.timestamp,
          });
        }
      }
    }

    values.push(portfolioValue(portfolio, point.price));
  }

  const finalValue = portfolioValue(portfolio, finalPoint.price);
  const totalReturn = finalValue / options.initialCash - 1;
  const benchmarkReturn = finalPoint.price / firstPoint.price - 1;

  return {
    benchmarkReturn,
    excessReturn: totalReturn - benchmarkReturn,
    feesPaid,
    finalValue,
    halted,
    initialValue: options.initialCash,
    maximumDrawdown,
    totalReturn,
    tradeCount: trades.length,
    trades,
    volatility: calculateVolatility(values),
  };
}

export { DEFAULT_BACKTEST_OPTIONS, runBacktest };
export type { BacktestOptions, BacktestResult, SimulatedTrade };
