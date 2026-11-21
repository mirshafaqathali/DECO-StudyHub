import type { ReminderItem } from '../types/study';

export type ReminderFilter = 'upcoming' | 'completed' | 'all';

export interface ReminderUrgency {
  daysRemaining: number;
  label: string;
  level: 'overdue' | 'urgent' | 'soon' | 'scheduled' | 'done';
}

export function getDaysRemaining(dueDateIso: string, referenceDateIso: string): number {
  const [dy, dm, dd] = dueDateIso.split('-').map(Number);
  const [ry, rm, rd] = referenceDateIso.split('-').map(Number);
  const dueUtc = Date.UTC(dy, dm - 1, dd);
  const refUtc = Date.UTC(ry, rm - 1, rd);
  return Math.round((dueUtc - refUtc) / (1000 * 60 * 60 * 24));
}

export function getReminderUrgency(
  reminder: Pick<ReminderItem, 'dueDate' | 'completed'>,
  referenceDateIso: string
): ReminderUrgency {
  if (reminder.completed) {
    return { daysRemaining: 0, label: 'Completed', level: 'done' };
  }
  const days = getDaysRemaining(reminder.dueDate, referenceDateIso);
  if (days < 0) {
    const overdueDays = Math.abs(days);
    return {
      daysRemaining: days,
      label: overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`,
      level: 'overdue',
    };
  }
  if (days === 0) {
    return { daysRemaining: 0, label: 'Due today', level: 'urgent' };
  }
  if (days === 1) {
    return { daysRemaining: 1, label: 'Due tomorrow', level: 'urgent' };
  }
  if (days <= 5) {
    return { daysRemaining: days, label: `In ${days} days`, level: 'soon' };
  }
  return { daysRemaining: days, label: `In ${days} days`, level: 'scheduled' };
}

export function sortAndFilterReminders(
  reminders: ReminderItem[],
  filter: ReminderFilter
): ReminderItem[] {
  const filtered = reminders.filter((item) => {
    if (filter === 'upcoming') return !item.completed;
    if (filter === 'completed') return item.completed;
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    if (a.dueDate !== b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }
    return a.title.localeCompare(b.title);
  });
}

export function getTodayIsoDate(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
