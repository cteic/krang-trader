import { describe, expect, it, vi } from "vitest";

import { SANDBOX_API_URL } from "./config.js";
import { RecallClient } from "./recall-client.js";

describe("RecallClient", () => {
  it("authenticates profile requests against the sandbox", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ agent: { handle: "krang-trader" }, success: true }),
        ),
      ),
    );
    const client = new RecallClient(
      { apiKey: "secret", apiUrl: SANDBOX_API_URL },
      fetcher,
    );

    await expect(client.getProfile()).resolves.toEqual({
      agent: { handle: "krang-trader" },
      success: true,
    });
    expect(fetcher).toHaveBeenCalledWith(
      `${SANDBOX_API_URL}/api/agent/profile`,
      {
        headers: {
          Authorization: "Bearer secret",
          "Content-Type": "application/json",
        },
        method: "GET",
      },
    );
  });

  it("surfaces API errors without exposing the key", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
          statusText: "Unauthorized",
        }),
      ),
    );
    const client = new RecallClient(
      { apiKey: "secret", apiUrl: SANDBOX_API_URL },
      fetcher,
    );

    await expect(client.getProfile()).rejects.toThrow(
      "Recall request failed (401): Unauthorized",
    );
  });
});
