import { db } from '@/db';
import { sessions } from '@/db/schema';
import { lt } from 'drizzle-orm';

export type CleanupExpiredSessionsResult = {
  timestamp: Date;
  deleted: number;
};

export async function cleanupExpiredSessions(): Promise<CleanupExpiredSessionsResult> {
  const now = new Date();

  const result = await db.delete(sessions).where(lt(sessions.expiresAt, now));

  return {
    timestamp: now,
    deleted: result.rowCount ?? 0,
  };
}
