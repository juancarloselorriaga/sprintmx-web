'use client';

import AuthControlsCompact from '@/components/auth/auth-controls-compact';
import { NavItems } from '@/components/layout/navigation/nav-items';
import { ThemeSwitcher } from '@/components/theme-switcher.client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from '@/types/auth';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FC, useEffect, useRef, useState } from 'react';

export function NavigationDrawerContent() {
  const [user] = useState<User | null>(null);
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (closeButtonRef.current) {
      closeButtonRef.current.click();
    }
  }, [pathname]);

  if (!user) return null;

  return (
    <SheetContent side="left" className="w-[80%] max-w-sm border-r p-0">
      <div className="flex flex-col h-full">
        <SheetHeader className="p-1 py-2 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle asChild>
              <Link href="/">
                SprintMX
              </Link>
            </SheetTitle>
            <SheetPrimitive.Close asChild ref={closeButtonRef}>
              <Button variant="ghost" size="icon" className="p-0 rounded-sm h-8 w-8">
                <PanelRightOpen size={20}/>
                <span className="sr-only">Close</span>
              </Button>
            </SheetPrimitive.Close>
          </div>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto">
          <NavItems/>
        </nav>

        <div className="mt-auto border-t p-4">
          <div className="flex w-full items-center justify-between">
            <AuthControlsCompact initialUser={user}/>
            <ThemeSwitcher/>
          </div>
        </div>
      </div>
    </SheetContent>
  );
}

const NavigationDrawer: FC = () => {
  const [open, setOpen] = useState(false);
  const [user] = useState<User | null>(null);
  const [isLoading] = useState(true);

  if (isLoading) {
    return <Skeleton className="h-10 w-10"/>;
  }

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-sm p-1 -ml-2 h-10 w-10 md:hidden">
          <PanelRightClose size={22}/>
        </Button>
      </SheetTrigger>
      <NavigationDrawerContent/>
    </Sheet>
  );
};

export default NavigationDrawer;
