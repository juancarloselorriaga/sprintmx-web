import { Trophy, Calendar, Newspaper, CircleHelp, Mail, Info } from 'lucide-react';

export const iconMap = {
  Trophy,
  Calendar,
  Newspaper,
  CircleHelp,
  Mail,
  Info,
} as const;

export interface MenuItem {
  href: string;
  label: string;
  iconName: keyof typeof iconMap;
}

export const navItems: MenuItem[] = [
  {
    href: '/results',
    label: 'Results',
    iconName: 'Trophy'
  },
  {
    href: '/events',
    label: 'Events',
    iconName: 'Calendar'
  },
  {
    href: '/news',
    label: 'News',
    iconName: 'Newspaper'
  },
  {
    href: '/help',
    label: 'Help',
    iconName: 'CircleHelp'
  },
  {
    href: '/contact',
    label: 'Contact',
    iconName: 'Mail'
  },
  {
    href: '/about',
    label: 'About',
    iconName: 'Info'
  },
];
