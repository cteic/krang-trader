import { describe, expect, it } from "vitest";

import { SANDBOX_API_URL, loadConfig } from "./config.js";

describe("loadConfig", () => {
  it("uses the Recall sandbox by default", () => {
    expect(loadConfig({ RECALL_API_KEY: "secret" })).toEqual({
      apiKey: "secret",
      apiUrl: SANDBOX_API_URL,
    });
  });

  it("rejects production URLs", () => {
    expect(() =>
      loadConfig({
        RECALL_API_KEY: "secret",
        RECALL_API_URL: "https://api.competitions.recall.network",
      }),
    ).toThrow("sandbox-only");
  });

  it("requires an API key", () => {
    expect(() => loadConfig({})).toThrow("RECALL_API_KEY is required");
  });
});
