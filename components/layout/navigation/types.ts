import type esMessages from '@/messages/es.json';
import { User } from '@/types/auth';

type NavigationMessages = typeof esMessages.Navigation;
export type NavigationMessageKey = keyof NavigationMessages;

// Icon unions by context
export type PublicNavIconName =
  | 'Info'
  | 'Mail'
  | 'CircleHelp'
  | 'Trophy'
  | 'Calendar'
  | 'Newspaper';

export type ProtectedNavIconName =
  | 'LayoutDashboard'
  | 'Settings'
  | 'User'
  | 'Users'
  | 'FileText';

export type NavIconName = PublicNavIconName | ProtectedNavIconName;

export interface NavItem<TIcon extends NavIconName = NavIconName> {
  href: string;
  labelKey: NavigationMessageKey;
  iconName: TIcon;
}

export interface NavigationDrawerContentProps {
  user: User | null;
  items: readonly NavItem[];
}
