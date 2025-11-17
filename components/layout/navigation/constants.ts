import { Activity, Brain, Feather, Notebook, Settings } from 'lucide-react';

export const iconMap = {
  Notebook,
  Feather,
  Activity,
  Brain,
  Settings,
} as const;

export interface MenuItem {
  href: string;
  label: string;
  iconName: keyof typeof iconMap;
}

export const navItems: MenuItem[] = [
  {
    href: '/journal',
    label: 'Journal',
    iconName: 'Notebook'
  },
  {
    href: '/daily-rating',
    label: 'Daily Rating',
    iconName: 'Feather'
  },
  {
    href: '/tracking',
    label: 'Tracker',
    iconName: 'Activity'
  },
  {
    href: '/insights',
    label: 'Insights',
    iconName: 'Brain'
  },
  {
    href: '/settings',
    label: 'Settings',
    iconName: 'Settings'
  },
];
