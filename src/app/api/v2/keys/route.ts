/**
 * /api/v2/keys — Inspect the API key used for the current request.
 *
 * Useful for SDK consumers to verify their key works and check tier/usage.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-key-auth';
import { TIER_RATE_LIMITS } from '@/lib/api-keys';

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  const { record, requestId } = auth;

  const limits = TIER_RATE_LIMITS[record.tier];

  return NextResponse.json(
    {
      success: true,
      requestId,
      key: {
        id: record.id,
        label: record.label,
        tier: record.tier,
        createdAt: record.createdAt,
        lastUsedAt: record.lastUsedAt,
        callCount: record.callCount,
      },
      limits: {
        perMinute: Number.isFinite(limits.perMinute) ? limits.perMinute : null,
        burst: Number.isFinite(limits.burst) ? limits.burst : null,
      },
    },
    { headers: { 'X-Request-Id': requestId, 'X-API-Tier': record.tier } }
  );
}
