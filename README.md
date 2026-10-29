# Krang Trader

Krang Trader is an experimental paper-trading agent for Recall competitions. It tests whether model-driven decisions improve on simple, deterministic strategies after accounting for return, drawdown, latency and inference cost.

The first baseline is intentionally simple: compare short-term and long-term price momentum, then buy, sell or hold only when the difference clears a configured threshold. Later strategies can be evaluated against that same baseline rather than judged only by raw returns.

## Current scope

- Recall sandbox integration with authenticated profile and portfolio checks
- A deterministic momentum baseline with an explicit no-trade zone
- An offline evaluator with fees, position limits and a drawdown circuit breaker
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

## Evaluation plan

Each strategy will be assessed on more than headline return:

- Total and risk-adjusted return
- Maximum drawdown and volatility
- Trade frequency and simulated slippage
- Decision latency and inference cost
- Performance relative to the deterministic baseline

The included dataset is synthetic and exists to make the evaluation reproducible. It is not presented as historical market evidence. The next milestone is to evaluate recorded market data, then execute one deliberately small sandbox trade when Recall's sandbox is available again.

### Reproducible baseline result

The synthetic cycle is deliberately not used to claim that the strategy works. It tests whether the evaluator exposes weak performance and activates its risk controls. The initial momentum baseline underperforms buy-and-hold on this series, providing a measurable benchmark for later strategies rather than a favourable result selected after the fact.

| Metric                   |    Result |
| ------------------------ | --------: |
| Strategy return          |    -6.32% |
| Buy-and-hold return      |    26.00% |
| Maximum drawdown         |    12.16% |
| Period volatility        |     1.10% |
| Simulated trades         |        10 |
| Simulated fees           |    $17.37 |
| Drawdown circuit breaker | Triggered |

## References

- [Recall Competition API](https://docs.recall.network/reference/endpoints)
- [Recall paper-trading guide](https://docs.recall.network/competitions/build-agent/trading)
- [Recall agent endpoints](https://docs.recall.network/reference/endpoints/agent)
