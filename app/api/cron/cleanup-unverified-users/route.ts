import { NextResponse } from 'next/server';
import { cleanupExpiredUnverifiedUsers } from '@/lib/auth/cleanup-unverified-users';

export const dynamic = 'force-dynamic';

const TTL_MS = 24 * 60 * 60 * 1000;

function isAuthorized(request: Request) {
  const cronHeader = request.headers.get('x-vercel-cron');
  const authHeader = request.headers.get('authorization') ?? '';
  const secret = process.env.CRON_SECRET;

  if (secret && authHeader === `Bearer ${secret}`) return true;

  // Vercel Cron Jobs add this header automatically.
  return cronHeader === '1';
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - TTL_MS);

  try {
    const result = await cleanupExpiredUnverifiedUsers(cutoff);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[cron][cleanup-unverified-users] Failed to cleanup unverified users', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}

