import { format } from 'date-fns';
import { ScheduleTemplate } from '../types';

export function todayKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? 'pm' : 'am';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${mStr}${period}`;
}

/**
 * Calculate the completion rate for a day based on schedule block completions.
 * Only blocks with `tracked === true` are considered.
 * @param template  The resolved template for that day (may be null if none assigned).
 * @param dayCompletions  A map of blockId -> boolean for that specific day.
 * @returns An integer percentage 0-100.
 */
export function getDayCompletionRate(
  template: ScheduleTemplate | null,
  dayCompletions: Record<string, boolean> | undefined,
): number {
  if (!template) return 0;
  const trackedBlocks = template.blocks.filter((b) => b.tracked);
  if (trackedBlocks.length === 0) return 0;
  if (!dayCompletions) return 0;
  const completed = trackedBlocks.filter((b) => dayCompletions[b.id]).length;
  return Math.round((completed / trackedBlocks.length) * 100);
}
