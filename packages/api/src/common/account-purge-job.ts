import { purgeDeletedAccounts } from "./account-deletion.js";

const PURGE_INTERVAL_MS = 24 * 60 * 60 * 1000;

async function runPurge(): Promise<void> {
  try {
    const count = await purgeDeletedAccounts();
    if (count > 0) {
      console.info(`[account-purge] Removed ${count} deleted account(s)`);
    }
  } catch (error) {
    console.error("[account-purge] Purge failed", error);
  }
}

/**
 * Runs the purge at start and then each day. The delete is idempotent, so
 * more than one API instance can run it safely.
 */
export function startAccountPurgeJob(): () => void {
  void runPurge();
  const timer = setInterval(() => void runPurge(), PURGE_INTERVAL_MS);
  timer.unref();
  return () => clearInterval(timer);
}
