const ACTIONS = {
  buy: "buy",
  hold: "hold",
  sell: "sell",
} as const;

type TradeAction = (typeof ACTIONS)[keyof typeof ACTIONS];

interface MarketSnapshot {
  currentPrice: number;
  longWindow: number[];
  shortWindow: number[];
}

interface TradeDecision {
  action: TradeAction;
  confidence: number;
  reason: string;
}

interface StrategyOptions {
  minimumDifference: number;
}

function average(values: number[]): number {
  if (
    values.length === 0 ||
    values.some((value) => !Number.isFinite(value) || value <= 0)
  ) {
    throw new Error("Price windows must contain positive finite values");
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function evaluateMomentum(
  snapshot: MarketSnapshot,
  options: StrategyOptions = { minimumDifference: 0.01 },
): TradeDecision {
  if (!Number.isFinite(snapshot.currentPrice) || snapshot.currentPrice <= 0) {
    throw new Error("Current price must be a positive finite value");
  }

  if (options.minimumDifference <= 0) {
    throw new Error("Minimum difference must be greater than zero");
  }

  const shortAverage = average(snapshot.shortWindow);
  const longAverage = average(snapshot.longWindow);
  const difference = (shortAverage - longAverage) / longAverage;
  const confidence = clamp(
    Math.abs(difference) / options.minimumDifference,
    0,
    1,
  );

  if (difference >= options.minimumDifference) {
    return {
      action: ACTIONS.buy,
      confidence,
      reason: "Short-term momentum is above the long-term baseline",
    };
  }

  if (difference <= -options.minimumDifference) {
    return {
      action: ACTIONS.sell,
      confidence,
      reason: "Short-term momentum is below the long-term baseline",
    };
  }

  return {
    action: ACTIONS.hold,
    confidence,
    reason: "Momentum remains inside the no-trade threshold",
  };
}

export { ACTIONS, evaluateMomentum };
export type { MarketSnapshot, StrategyOptions, TradeAction, TradeDecision };
