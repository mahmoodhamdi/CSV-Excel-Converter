/**
 * Redis-based Rate Limiting with Memory Fallback
 *
 * Uses Upstash Redis for distributed rate limiting when available,
 * falls back to in-memory rate limiting for single-instance deployments.
 */

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

// Convert window to duration string for Upstash
function getWindowDuration(): `${number} s` | `${number} m` | `${number} h` {
  const seconds = Math.floor(RATE_LIMIT_WINDOW_MS / 1000);
  if (seconds >= 3600 && seconds % 3600 === 0) {
    return `${seconds / 3600} h`;
  }
  if (seconds >= 60 && seconds % 60 === 0) {
    return `${seconds / 60} m`;
  }
  return `${seconds} s`;
}

// Initialize Redis client if environment variables are set
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX_REQUESTS, getWindowDuration()),
      analytics: true,
      prefix: 'csv-converter',
    });

    console.log('[Rate Limit] Redis rate limiting initialized');
  } catch (error) {
    console.warn('[Rate Limit] Failed to initialize Redis, using memory fallback:', error);
  }
}

// Memory-based rate limiting fallback
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore.entries()) {
      if (entry.resetTime <= now) {
        memoryStore.delete(key);
      }
    }
  }, 60000); // Clean up every minute
}

/**
 * Rate limit result interface
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  pending?: Promise<unknown>;
}

/**
 * Check rate limit for an identifier (usually IP address)
 */
export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  // Use Redis if available
  if (ratelimit) {
    try {
      const result = await ratelimit.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        pending: result.pending,
      };
    } catch (error) {
      console.warn('[Rate Limit] Redis error, falling back to memory:', error);
      // Fall through to memory-based limiting
    }
  }

  // Memory-based fallback
  const now = Date.now();
  const entry = memoryStore.get(identifier);

  if (!entry || entry.resetTime <= now) {
    // Create new entry
    const resetTime = now + RATE_LIMIT_WINDOW_MS;
    memoryStore.set(identifier, { count: 1, resetTime });
    return {
      success: true,
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      reset: resetTime,
    };
  }

  // Increment existing entry
  entry.count++;

  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return {
      success: false,
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: 0,
      reset: entry.resetTime,
    };
  }

  return {
    success: true,
    limit: RATE_LIMIT_MAX_REQUESTS,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
    reset: entry.resetTime,
  };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'X-RateLimit-Reset': String(result.reset),
  };
}

/**
 * Check if Redis is connected
 */
export function isRedisConnected(): boolean {
  return ratelimit !== null;
}

/**
 * Get current rate limit configuration
 */
export function getRateLimitConfig(): { windowMs: number; maxRequests: number; isRedis: boolean } {
  return {
    windowMs: RATE_LIMIT_WINDOW_MS,
    maxRequests: RATE_LIMIT_MAX_REQUESTS,
    isRedis: isRedisConnected(),
  };
}
