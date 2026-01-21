import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import {
  checkRateLimit as checkRedisRateLimit,
  getRateLimitHeaders as getRedisRateLimitHeaders,
  isRedisConnected,
  type RateLimitResult,
} from './lib/rate-limit-redis';
import {
  checkRateLimit as checkMemoryRateLimit,
  getRateLimitHeaders as getMemoryRateLimitHeaders,
} from './lib/rate-limit';

// Security headers
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Content Security Policy
const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'img-src': ["'self'", 'data:', 'blob:', 'https:'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'connect-src': ["'self'", 'https:', 'wss:'],
  'frame-ancestors': ["'self'"],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
};

// Add Sentry tunnel to CSP if configured
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  cspDirectives['connect-src'].push('https://*.ingest.sentry.io');
}

function buildCSP(): string {
  return Object.entries(cspDirectives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

// Create the i18n middleware
const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip rate limiting for Sentry monitoring tunnel
  if (pathname === '/monitoring') {
    return NextResponse.next();
  }

  // Handle API routes with rate limiting
  if (pathname.startsWith('/api/')) {
    // Get client identifier (IP address or forwarded IP)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

    let rateLimitResult: RateLimitResult;
    let rateLimitHeaders: Record<string, string>;

    // Try Redis rate limiting first, fall back to memory
    if (isRedisConnected()) {
      rateLimitResult = await checkRedisRateLimit(ip);
      rateLimitHeaders = getRedisRateLimitHeaders(rateLimitResult);
    } else {
      const memoryResult = checkMemoryRateLimit(ip);
      rateLimitResult = {
        success: memoryResult.success,
        limit: memoryResult.limit,
        remaining: memoryResult.remaining,
        reset: memoryResult.resetTime,
      };
      rateLimitHeaders = getMemoryRateLimitHeaders(memoryResult);
    }

    if (!rateLimitResult.success) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...rateLimitHeaders,
            ...securityHeaders,
          },
        }
      );
    }

    // For API routes, add headers and continue
    const response = NextResponse.next();

    // Add rate limit headers
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value);
    }

    // Add security headers
    for (const [key, value] of Object.entries(securityHeaders)) {
      response.headers.set(key, value);
    }

    return response;
  }

  // Handle i18n routes
  const response = intlMiddleware(request);

  // Add security headers to all responses
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // Add CSP header
  response.headers.set('Content-Security-Policy', buildCSP());

  return response;
}

export const config = {
  matcher: [
    // Match all pathnames except static files and internal Next.js routes
    '/((?!_next/static|_next/image|favicon.ico|icon-.*\\.png|robots.txt|sitemap.xml).*)',
  ],
};
