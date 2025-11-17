'use client';

import { iconMap } from '@/components/layout/navigation/constants';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface NavItemsClientProps {
  href: string;
  label: string;
  iconName: keyof typeof iconMap;
  iconSize: number;
  iconClassName?: string;
  linkClassName?: string;
  showLabel?: boolean;
}

export function NavItems({
  href,
  label,
  iconName,
  iconSize,
  iconClassName,
  linkClassName,
  showLabel,
}: NavItemsClientProps) {
  const Icon = iconMap[iconName];

  const content = (
    <Link
      href={href}
      className={cn(
        'flex items-center space-x-3 px-2 py-2 text-md font-medium rounded-lg hover:bg-accent transition-colors',
        linkClassName
      )}
      aria-label={label}
    >
      <Icon size={iconSize} className={cn('flex-shrink-0', iconClassName)}/>
      {showLabel && <span>{label}</span>}
    </Link>
  );

  if (!showLabel) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent>
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
