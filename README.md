# Krang Trader

Krang Trader is an experimental paper-trading agent for Recall competitions. It tests whether model-driven decisions improve on simple, deterministic strategies after accounting for return, drawdown, latency and inference cost.

The first baseline is intentionally simple: compare short-term and long-term price momentum, then buy, sell or hold only when the difference clears a configured threshold. Later strategies can be evaluated against that same baseline rather than judged only by raw returns.

## Current scope

- Recall sandbox integration with authenticated profile and portfolio checks
- A deterministic momentum baseline with an explicit no-trade zone
- An offline evaluator with fees, minimum order sizes, a 75% buy-allocation ceiling and a drawdown circuit breaker
- A dated STX/USD daily-price snapshot recorded from Kraken's public API
- Reproducible comparison with a buy-and-hold benchmark
- Strict sandbox URL enforcement
- Runtime configuration validation
- Unit tests for configuration, API behaviour and trading decisions
- No automatic or production trading

## Safety model

Krang Trader currently exposes read-only commands. The client refuses to connect to Recall's production API, and credentials are loaded from an ignored environment file. Trade execution will be added behind an explicit sandbox-only confirmation boundary after the connection is verified.

## Setup

Requirements:

- Node.js 20 or newer
- pnpm 11
- A Recall agent API key

```sh
pnpm install
cp .env.example .env
```

Add the Recall agent key to `.env`. Recall currently uses the production agent key with its sandbox API:

```text
RECALL_API_KEY=your-agent-key
RECALL_API_URL=https://api.sandbox.competitions.recall.network
```

Never commit `.env` or share the key.

Verify the registered agent profile:

```sh
pnpm dev profile
```

Inspect the sandbox portfolio:

```sh
pnpm dev portfolio
```

Run the complete local verification suite:

```sh
pnpm check
```

Run the offline evaluation without an API key or network connection:

```sh
pnpm backtest
```

Replay the strategy against the latest 90 recorded STX/USD daily closing prices
and print every simulated trade:

```sh
pnpm backtest:stx
```

Record a new dated dataset from Kraken. The final, still-open daily candle is
excluded so the snapshot only contains completed periods:

```sh
pnpm market-data:stx
```

Pass the generated file to `src/backtest-cli.ts` when evaluating it. The
committed snapshot remains unchanged so the published result stays
reproducible.

The resulting trades are simulations over historical prices. They are not live
orders, investment advice or evidence that the strategy will perform similarly
in future.

### Recorded STX result

The default STX evaluation covers the latest 90 completed candles in the
committed snapshot, from 31 July to 28 October 2026. The strategy made money in
the rising market but materially underperformed simply holding STX. It then
liquidated when the market moved through its drawdown threshold.

| Metric                       |        Result |
| ---------------------------- | ------------: |
| Strategy return              |        42.90% |
| STX buy-and-hold return      |       117.65% |
| Excess return                | -74.74 points |
| Maximum drawdown             |        12.50% |
| Simulated trades             |            21 |
| Simulated fees               |        $40.61 |
| Maximum allocation after buy |        75.00% |
| Drawdown circuit breaker     |     Triggered |

The drawdown can finish above the configured 12% limit because daily candles
only provide one execution price per day. The simulator liquidates at the next
observed close rather than pretending it could fill at a price that was never
available to it. The weak relative return and late exit are findings to improve,
not results to hide.

## Evaluation plan

Each strategy will be assessed on more than headline return:

- Total and risk-adjusted return
- Maximum drawdown and volatility
- Trade frequency and simulated slippage
- Decision latency and inference cost
- Performance relative to the deterministic baseline

The synthetic dataset exists to make the evaluator itself reproducible and is
not presented as historical market evidence. The dated STX/USD dataset contains
720 completed daily candles recorded from Kraken on 29 October 2026. The default
STX command evaluates a fixed 90-day period rather than selecting a favourable
start date after seeing the result. Pass a different `--last` value to challenge
the strategy over another fixed period. The next milestone is to execute one
deliberately small sandbox trade when Recall's sandbox is available again.

### Stacks on-chain context

[stacks-mcp](https://github.com/pete-watters/stacks-mcp) can provide read-only
Stacks balances, token positions and transaction history to a later strategy.
It is deliberately not treated as a price feed or inserted into this baseline
without evidence that a specific on-chain input improves the evaluation. This
keeps the deterministic price-only result as a control against which an
on-chain or model-driven strategy can be measured.

### Reproducible baseline result

The synthetic cycle is deliberately not used to claim that the strategy works.
It tests whether the evaluator exposes weak performance while enforcing its
buy-allocation ceiling. The initial momentum baseline underperforms buy-and-hold
on this series, providing a measurable benchmark for later strategies rather
than a favourable result selected after the fact.

| Metric                   |  Result |
| ------------------------ | ------: |
| Strategy return          |  -1.05% |
| Buy-and-hold return      |  26.00% |
| Maximum drawdown         |  11.11% |
| Period volatility        |   1.39% |
| Simulated trades         |      21 |
| Simulated fees           |  $23.73 |
| Drawdown circuit breaker | Not hit |

## References

- [Recall Competition API](https://docs.recall.network/reference/endpoints)
- [Recall paper-trading guide](https://docs.recall.network/competitions/build-agent/trading)
- [Recall agent endpoints](https://docs.recall.network/reference/endpoints/agent)
- [Kraken Spot REST API](https://docs.kraken.com/api/docs/rest-api/get-ohlc-data/)
