/**
 * Idempotency support for the mock API layer.
 *
 * WHY this exists in the mock at all: every mutating endpoint in the real
 * backend honours an `Idempotency-Key` header (see `api-client.ts`, which
 * forwards it), because this app records money and gets retried on flaky
 * office-LAN connections. If the mock ignored the key, a double-submit would
 * look harmless in development and then duplicate a purchase the first time it
 * ran against a real server — the exact class of bug the header prevents.
 * Implementing it here keeps the mock honest about the contract.
 *
 * The replay window is per-session and unbounded, which is fine for a mock: it
 * is deleted along with the rest of the mock layer.
 */
const replayCache = new Map<string, unknown>();

export function createIdempotencyKey(): string {
  return crypto.randomUUID();
}

/**
 * Runs `produce` once per key. A repeat call with the same key returns the
 * first result instead of performing the write again.
 */
export function replayIfSeen<T>(key: string | undefined, produce: () => T): T {
  if (!key) return produce();

  if (replayCache.has(key)) {
    return replayCache.get(key) as T;
  }

  const result = produce();
  replayCache.set(key, result);
  return result;
}

/** Test helper — clears the replay window. */
export function resetIdempotencyCache(): void {
  replayCache.clear();
}
