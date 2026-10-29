import "dotenv/config";

import { loadConfig } from "./config.js";
import { RecallClient } from "./recall-client.js";

const COMMANDS = {
  portfolio: "portfolio",
  profile: "profile",
} as const;

function printUsage(): void {
  console.log("Usage: pnpm dev -- <profile|portfolio>");
}

async function main(): Promise<void> {
  const command = process.argv[2];

  if (command !== COMMANDS.profile && command !== COMMANDS.portfolio) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const client = new RecallClient(loadConfig());
  const result =
    command === COMMANDS.profile
      ? await client.getProfile()
      : await client.getPortfolio();

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unexpected error";
  console.error(message);
  process.exitCode = 1;
});
