'use client';

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface NavActionContentProps {
  icon: LucideIcon;
  label: string;
  collapsed?: boolean;
  iconSize?: number;
  labelDelay?: string;
  labelClassName?: string;
  iconClassName?: string;
}

export const navActionContainer = (
  className?: string,
) =>
  cn(
    'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 ease-in-out',
    className
  );

export function NavActionContent({
  icon: Icon,
  label,
  collapsed = false,
  iconSize = 20,
  labelDelay = '120ms',
  labelClassName,
  iconClassName,
}: NavActionContentProps) {
  return (
    <>
      <Icon
        size={iconSize}
        className={cn(
          'flex-shrink-0 transition-colors group-hover:text-foreground',
          iconClassName
        )}
      />
      <div
        className={cn(
          'relative min-w-0 h-5 flex-1'
        )}
      >
        <span
          className={cn(
            'absolute inset-y-0 left-0 right-0 overflow-hidden whitespace-nowrap text-left transition-opacity duration-300 ease-in-out',
            collapsed ? 'opacity-0' : 'opacity-100',
            labelClassName
          )}
          style={{ transitionDelay: collapsed ? '0ms' : labelDelay }}
        >
          {label}
        </span>
        <span
          aria-hidden
          className={cn(
            'absolute inset-y-0 left-0 right-0 overflow-hidden whitespace-nowrap text-left transition-opacity duration-300 ease-in-out',
            collapsed ? 'opacity-100' : 'opacity-0',
            labelClassName
          )}
          style={{ transitionDelay: collapsed ? '120ms' : '0ms' }}
        >
          {label}
        </span>
      </div>
    </>
  );
}
