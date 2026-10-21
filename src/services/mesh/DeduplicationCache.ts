export class DeduplicationCache {
  private cache: Map<string, number> = new Map(); // messageId -> timestamp
  private maxEntries: number;
  private ttlMs: number;

  constructor(maxEntries: number = 2000, ttlMs: number = 60 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
  }

  /**
   * Returns true if messageId is already seen; otherwise records it and returns false.
   */
  checkAndRecord(messageId: string): boolean {
    const now = Date.now();
    this.purgeStale(now);

    if (this.cache.has(messageId)) {
      return true; // Duplicate
    }

    if (this.cache.size >= this.maxEntries) {
      // Evict oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(messageId, now);
    return false; // New packet
  }

  private purgeStale(now: number) {
    for (const [id, ts] of this.cache.entries()) {
      if (now - ts > this.ttlMs) {
        this.cache.delete(id);
      } else {
        break; // Map maintains insertion order
      }
    }
  }

  size(): number {
    return this.cache.size;
  }

  clear() {
    this.cache.clear();
  }
}
