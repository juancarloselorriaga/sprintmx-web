'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { PanelRightClose } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const NavigationDrawerContent = dynamic(
  () => import('./nav-drawer.client').then(mod => mod.NavigationDrawerContent),
  { ssr: false }
);

export function NavigationBar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-sm p-1 -ml-2 h-10 w-10">
            <PanelRightClose size={22}/>
          </Button>
        </SheetTrigger>
        {open && <NavigationDrawerContent/>}
      </Sheet>
    </div>
  );
}
