import { NextRequest, NextResponse } from 'next/server';
import { getStats, getFormattedUptime } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  // Simple token-based auth
  const token = request.nextUrl.searchParams.get('token') ||
    request.headers.get('x-admin-token');
  const adminToken = process.env.ADMIN_TOKEN;

  if (adminToken && token !== adminToken) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const stats = getStats();
  const uptime = getFormattedUptime();

  return NextResponse.json({
    success: true,
    data: {
      ...stats,
      uptimeFormatted: uptime,
    },
  });
}
