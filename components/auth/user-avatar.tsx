import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User } from '@/types/auth';
import { capitalize } from '@/utils/capitalize';
import { cva, type VariantProps } from 'class-variance-authority';
import Link, { LinkProps } from 'next/link';
import type { FC, HTMLAttributes } from 'react';

const avatarVariants = cva('cursor-pointer bg-primary/10', {
  variants: {
    size: {
      default: 'h-10 w-10',
      sm: 'h-8 w-8 text-sm',
      xs: 'h-6 w-6 text-sm',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

interface UserAvatarProps
  extends Omit<LinkProps, 'href'>,
    Omit<HTMLAttributes<HTMLAnchorElement>, keyof LinkProps>,
    VariantProps<typeof avatarVariants> {
  user: User | null;
  className?: string;
  avatarClassName?: string;
}

const UserAvatar: FC<UserAvatarProps> = ({
  user,
  size,
  className,
  avatarClassName,
  ...props
}) => {
  return (
    <Avatar className={cn(avatarVariants({ size }), className)}>
      <AvatarFallback className={cn('cursor-pointer', avatarClassName)} asChild>
        <Link href="/protected/settings" {...props}>
          {capitalize(user?.email?.[0] || '?')}
        </Link>
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
