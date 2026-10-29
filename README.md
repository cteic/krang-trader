# Krang Trader

Krang Trader is an experimental paper-trading agent for Recall competitions. It tests whether model-driven decisions improve on simple, deterministic strategies after accounting for return, drawdown, latency and inference cost.

The first baseline is intentionally simple: compare short-term and long-term price momentum, then buy, sell or hold only when the difference clears a configured threshold. Later strategies can be evaluated against that same baseline rather than judged only by raw returns.

## Current scope

- Recall sandbox integration with authenticated profile and portfolio checks
- A deterministic momentum baseline with an explicit no-trade zone
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
pnpm dev -- profile
```

Inspect the sandbox portfolio:

```sh
pnpm dev -- portfolio
```

Run the complete local verification suite:

```sh
pnpm check
```

## Evaluation plan

Each strategy will be assessed on more than headline return:

- Total and risk-adjusted return
- Maximum drawdown and volatility
- Trade frequency and simulated slippage
- Decision latency and inference cost
- Performance relative to the deterministic baseline

The next milestone is one deliberately small sandbox trade, followed by recorded portfolio and trade-history evidence.

## References

- [Recall Competition API](https://docs.recall.network/reference/endpoints)
- [Recall paper-trading guide](https://docs.recall.network/competitions/build-agent/trading)
- [Recall agent endpoints](https://docs.recall.network/reference/endpoints/agent)
