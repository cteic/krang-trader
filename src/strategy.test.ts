import { describe, expect, it } from "vitest";

import { ACTIONS, evaluateMomentum } from "./strategy.js";

describe("evaluateMomentum", () => {
  it("buys when short-term momentum clears the threshold", () => {
    const decision = evaluateMomentum({
      currentPrice: 104,
      longWindow: [99, 100, 101],
      shortWindow: [103, 104, 105],
    });

    expect(decision.action).toBe(ACTIONS.buy);
    expect(decision.confidence).toBe(1);
  });

  it("sells when short-term momentum falls below the threshold", () => {
    const decision = evaluateMomentum({
      currentPrice: 96,
      longWindow: [99, 100, 101],
      shortWindow: [95, 96, 97],
    });

    expect(decision.action).toBe(ACTIONS.sell);
    expect(decision.confidence).toBe(1);
  });

  it("holds inside the no-trade threshold", () => {
    const decision = evaluateMomentum({
      currentPrice: 100,
      longWindow: [99, 100, 101],
      shortWindow: [100, 100, 100],
    });

    expect(decision.action).toBe(ACTIONS.hold);
    expect(decision.confidence).toBe(0);
  });
});
