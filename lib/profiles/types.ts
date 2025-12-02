import { profiles } from '@/db/schema';
import { z } from 'zod';
import { profileSchema, profileUpsertSchema } from './schema';

export type ProfileRecord = typeof profiles.$inferSelect;
export type ProfileInsert = typeof profiles.$inferInsert;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ProfileUpsertInput = z.infer<typeof profileUpsertSchema>;

export type ProfileStatus = {
  hasProfile: boolean;
  isComplete: boolean;
  mustCompleteProfile: boolean;
};
