const SANDBOX_API_URL = "https://api.sandbox.competitions.recall.network";

interface TraderConfig {
  apiKey: string;
  apiUrl: typeof SANDBOX_API_URL;
}

function loadConfig(
  environment: NodeJS.ProcessEnv = process.env,
): TraderConfig {
  const apiKey = environment.RECALL_API_KEY?.trim();
  const apiUrl = environment.RECALL_API_URL?.trim() ?? SANDBOX_API_URL;

  if (!apiKey) {
    throw new Error("RECALL_API_KEY is required");
  }

  if (apiUrl !== SANDBOX_API_URL) {
    throw new Error(
      `Krang Trader is sandbox-only. Expected ${SANDBOX_API_URL}`,
    );
  }

  return { apiKey, apiUrl };
}

export { SANDBOX_API_URL, loadConfig };
export type { TraderConfig };
