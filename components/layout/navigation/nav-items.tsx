import { navItems } from '@/components/layout/navigation/constants';
import { NavItems as NavItemsClient } from '@/components/layout/navigation/nav-items.client';
import { cn } from '@/lib/utils';

interface NavItemsProps {
  containerClassName?: string;
  itemClassName?: string;
  iconClassName?: string;
  linkClassName?: string;
  iconSize?: number;
  showLabels?: boolean;
}

export function NavItems({
  containerClassName,
  itemClassName,
  iconClassName,
  linkClassName,
  iconSize = 20,
  showLabels = true,
}: NavItemsProps) {
  return (
    <div className={cn('flex flex-col space-y-4 p-4', containerClassName)}>
      {navItems.map(item => (
        <div key={item.href} className={cn('flex flex-row items-center', itemClassName)}>
          <NavItemsClient
            href={item.href}
            label={item.label}
            iconName={item.iconName}
            iconSize={iconSize}
            iconClassName={iconClassName}
            linkClassName={linkClassName}
            showLabel={showLabels}
          />
        </div>
      ))}
    </div>
  );
}
