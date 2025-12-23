/**
 * LRU-like cache with size limits and TTL support
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  size: number;
  key: string;
}

interface CacheOptions {
  /** Maximum cache size in bytes (default: 50MB) */
  maxSize?: number;
  /** Maximum age for cache entries in milliseconds (default: 5 minutes) */
  maxAge?: number;
}

/**
 * Simple hash function for generating cache keys
 */
function hash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Conversion cache with LRU-like eviction
 */
class ConversionCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize: number;
  private maxAge: number;
  private currentSize = 0;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize ?? 50 * 1024 * 1024; // 50MB default
    this.maxAge = options.maxAge ?? 5 * 60 * 1000; // 5 minutes default
  }

  /**
   * Generate a unique cache key from input and options
   */
  private generateKey(input: string, options: Record<string, unknown>): string {
    const optionsStr = JSON.stringify(options);
    // Use a hash of input + options for efficiency
    const inputHash = hash(input.slice(0, 1000) + input.length.toString());
    const optionsHash = hash(optionsStr);
    return `${inputHash}_${optionsHash}`;
  }

  /**
   * Get estimated size of data in bytes
   */
  private getSize(data: unknown): number {
    try {
      return JSON.stringify(data).length * 2; // UTF-16 characters
    } catch {
      return 0;
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      const entry = this.cache.get(key);
      if (entry) {
        this.currentSize -= entry.size;
        this.cache.delete(key);
      }
    }
  }

  /**
   * Evict oldest entries to make room
   */
  private evict(neededSize: number): void {
    // Sort entries by timestamp (oldest first)
    const entries = Array.from(this.cache.entries()).sort(
      ([, a], [, b]) => a.timestamp - b.timestamp
    );

    let freedSpace = 0;
    for (const [key, entry] of entries) {
      if (this.currentSize - freedSpace + neededSize <= this.maxSize) {
        break;
      }
      this.cache.delete(key);
      freedSpace += entry.size;
    }

    this.currentSize -= freedSpace;
  }

  /**
   * Get cached data
   */
  get<T>(input: string, options: Record<string, unknown> = {}): T | null {
    const key = this.generateKey(input, options);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      return null;
    }

    // Update timestamp (LRU behavior)
    entry.timestamp = Date.now();

    return entry.data as T;
  }

  /**
   * Set cached data
   */
  set<T>(input: string, options: Record<string, unknown>, data: T): void {
    const key = this.generateKey(input, options);
    const size = this.getSize(data);

    // Don't cache if single entry is too large (> 25% of max)
    if (size > this.maxSize * 0.25) {
      return;
    }

    // Remove old entry if exists
    const existing = this.cache.get(key);
    if (existing) {
      this.currentSize -= existing.size;
      this.cache.delete(key);
    }

    // Cleanup expired entries
    this.cleanup();

    // Evict old entries if needed
    if (this.currentSize + size > this.maxSize) {
      this.evict(size);
    }

    // Store new entry
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      size,
      key,
    });
    this.currentSize += size;
  }

  /**
   * Check if key exists in cache
   */
  has(input: string, options: Record<string, unknown> = {}): boolean {
    const key = this.generateKey(input, options);
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      return false;
    }

    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    entries: number;
    currentSize: number;
    maxSize: number;
    utilization: number;
  } {
    return {
      entries: this.cache.size,
      currentSize: this.currentSize,
      maxSize: this.maxSize,
      utilization: this.currentSize / this.maxSize,
    };
  }

  /**
   * Remove a specific entry
   */
  delete(input: string, options: Record<string, unknown> = {}): boolean {
    const key = this.generateKey(input, options);
    const entry = this.cache.get(key);

    if (entry) {
      this.currentSize -= entry.size;
      return this.cache.delete(key);
    }

    return false;
  }
}

// Export singleton instance for app-wide use
export const conversionCache = new ConversionCache();

// Export class for custom instances
export { ConversionCache };
export type { CacheOptions, CacheEntry };
