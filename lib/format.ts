/** Small display helpers shared by the catalogue UI. */

import type { Permission } from './validator';

export const PERMISSION_LABELS: Record<Permission, string> = {
  reminders: 'Reminders and timers',
  notifications: 'Notifications',
  vibration: 'Vibration',
  motion: 'Motion and step sensing',
  location: 'Location',
  widget: 'Home-screen widget',
};

export function permissionLabel(p: string): string {
  return PERMISSION_LABELS[p as Permission] ?? p;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatInstalls(n: number): string {
  if (n === 1) {
    return '1 install';
  }
  return `${n} installs`;
}
