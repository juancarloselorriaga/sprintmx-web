import { ProfileStatus } from '@/lib/profiles/types';
import { createContext, useContext, useState, type ReactNode } from 'react';

type OnboardingOverrides = {
  profileStatusOverride: ProfileStatus | null;
  setProfileStatusOverride: (status: ProfileStatus | null) => void;
};

const OnboardingContext = createContext<OnboardingOverrides | null>(null);

export function OnboardingOverridesProvider({ children }: { children: ReactNode }) {
  const [profileStatusOverride, setProfileStatusOverride] = useState<ProfileStatus | null>(null);

  return (
    <OnboardingContext.Provider value={{ profileStatusOverride, setProfileStatusOverride }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingOverrides() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboardingOverrides must be used within OnboardingOverridesProvider');
  }
  return ctx;
}
