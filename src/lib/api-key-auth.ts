/**
 * Authentication helper for /api/v2/* routes.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { verifyApiKey, type ApiKeyRecord } from './api-keys';
import { generateRequestId, createErrorResponse } from './api-utils';
import { ErrorCodes } from './errors';

export interface AuthSuccess {
  ok: true;
  record: ApiKeyRecord;
  requestId: string;
}

export interface AuthFailure {
  ok: false;
  response: NextResponse;
}

export async function authenticateRequest(
  request: NextRequest
): Promise<AuthSuccess | AuthFailure> {
  const requestId = generateRequestId();
  const headerKey = request.headers.get('x-api-key');
  const auth = request.headers.get('authorization');
  const bearerKey = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  const presented = headerKey ?? bearerKey;

  if (!presented) {
    return {
      ok: false,
      response: createErrorResponse(
        'API key required. Pass X-API-Key header or Authorization: Bearer <key>.',
        ErrorCodes.UNAUTHORIZED,
        401,
        requestId
      ),
    };
  }

  const record = await verifyApiKey(presented);
  if (!record) {
    return {
      ok: false,
      response: createErrorResponse(
        'Invalid or revoked API key.',
        ErrorCodes.UNAUTHORIZED,
        401,
        requestId
      ),
    };
  }

  return { ok: true, record, requestId };
}
