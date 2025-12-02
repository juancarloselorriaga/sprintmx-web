import type { ProfileRecord, ProfileStatus } from './types';

const REQUIRED_FIELDS: (keyof ProfileRecord)[] = [
  'phone',
  'city',
  'state',
  'dateOfBirth',
  'emergencyContactName',
  'emergencyContactPhone',
];

const isPresent = (value: unknown) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  return true;
};

export type ComputeProfileStatusParams = {
  profile: ProfileRecord | null | undefined;
  isInternal?: boolean;
};

export function computeProfileStatus({
  profile,
  isInternal = false,
}: ComputeProfileStatusParams): ProfileStatus {
  const hasProfile = Boolean(profile);
  const isComplete =
    hasProfile &&
    REQUIRED_FIELDS.every((field) => {
      const value = profile?.[field];
      return isPresent(value);
    });

  return {
    hasProfile,
    isComplete,
    mustCompleteProfile: !isInternal && !isComplete,
  };
}
