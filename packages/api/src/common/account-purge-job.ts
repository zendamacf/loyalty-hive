import { purgeDeletedAccounts } from "./account-deletion.js";

const PURGE_INTERVAL_MS = 24 * 60 * 60 * 1000;

async function runPurge(purge: () => Promise<number>): Promise<void> {
  try {
    const count = await purge();
    console.info(
      count > 0
        ? `[account-purge] Removed ${count} deleted account(s)`
        : "[account-purge] No deleted accounts to remove",
    );
  } catch (error) {
    console.error("[account-purge] Purge failed", error);
  }
}

/**
 * Runs the purge at start and then each day. The delete is idempotent, so
 * more than one API instance can run it safely.
 */
export function startAccountPurgeJob(
  purge: () => Promise<number> = purgeDeletedAccounts,
): () => void {
  void runPurge(purge);
  const timer = setInterval(() => void runPurge(purge), PURGE_INTERVAL_MS);
  timer.unref();
  return () => clearInterval(timer);
}
