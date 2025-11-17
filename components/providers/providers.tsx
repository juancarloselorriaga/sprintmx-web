import React, { ReactNode } from 'react';
import { ThemeProvider } from './theme-provider.client';

interface ProvidersWrapperProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersWrapperProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
