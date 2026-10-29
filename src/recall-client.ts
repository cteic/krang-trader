import type { TraderConfig } from "./config.js";

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

function defaultFetch(input: string, init?: RequestInit): Promise<Response> {
  return fetch(input, init);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(body: unknown): string | undefined {
  if (!isRecord(body)) {
    return undefined;
  }

  if (typeof body.message === "string") {
    return body.message;
  }

  return typeof body.error === "string" ? body.error : undefined;
}

class RecallClient {
  private readonly config: TraderConfig;
  private readonly fetcher: Fetcher;

  constructor(config: TraderConfig, fetcher: Fetcher = defaultFetch) {
    this.config = config;
    this.fetcher = fetcher;
  }

  async getProfile(): Promise<unknown> {
    return this.request("/api/agent/profile");
  }

  async getPortfolio(): Promise<unknown> {
    return this.request("/api/agent/portfolio");
  }

  private async request(path: string): Promise<unknown> {
    const response = await this.fetcher(`${this.config.apiUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      method: "GET",
    });

    const body: unknown = await response.json();

    if (!response.ok) {
      const detail = getErrorMessage(body) ?? response.statusText;
      throw new Error(
        `Recall request failed (${String(response.status)}): ${detail}`,
      );
    }

    return body;
  }
}

export { RecallClient };
export type { Fetcher };
