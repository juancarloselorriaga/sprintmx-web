import NavigationBar from '@/components/layout/navigation/nav-bar';
import { Providers } from '@/components/providers/providers';
import { ReactNode } from 'react';

interface RootLayoutWrapperProps {
  children: ReactNode;
}

export default function RootLayoutWrapper({ children }: RootLayoutWrapperProps) {
  return (
    <Providers>
      <div className="relative min-h-screen flex flex-col">
        <NavigationBar/>
        <main className="flex-1 flex w-full max-w-7xl mx-auto p-5 pt-16">{children}</main>
      </div>
    </Providers>
  );
}
