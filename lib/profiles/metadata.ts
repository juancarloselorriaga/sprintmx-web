import type { ProfileRequirementSummary } from './requirements';

export const SHIRT_SIZES = ['xs', 's', 'm', 'l', 'xl', 'xxl'] as const;

export type ShirtSize = (typeof SHIRT_SIZES)[number];

export const BLOOD_TYPES = ['a+', 'a-', 'b+', 'b-', 'ab+', 'ab-', 'o+', 'o-'] as const;

export type BloodType = (typeof BLOOD_TYPES)[number];

export type ProfileMetadata = {
  shirtSizes: readonly ShirtSize[];
  bloodTypes: readonly BloodType[];
  requiredCategories: ProfileRequirementSummary['categories'];
  requiredFieldKeys: ProfileRequirementSummary['fieldKeys'];
};

export function buildProfileMetadata(
  summary: ProfileRequirementSummary
): ProfileMetadata {
  return {
    shirtSizes: SHIRT_SIZES,
    bloodTypes: BLOOD_TYPES,
    requiredCategories: summary.categories,
    requiredFieldKeys: summary.fieldKeys,
  };
}
