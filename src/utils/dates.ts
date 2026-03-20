import { format } from 'date-fns';
import { Task } from '../types';

export function todayKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function calcCompletionDate(task: Task): string | null {
  if (!task.totalAmount || !task.dailyGoalAmount || task.dailyGoalAmount <= 0) return null;

  const completedDays = Object.values(task.completions).filter(Boolean).length;
  const completedAmount = completedDays * task.dailyGoalAmount;
  const remaining = task.totalAmount - completedAmount;
  if (remaining <= 0) return 'Done';

  const daysLeft = Math.ceil(remaining / task.dailyGoalAmount);
  const target = new Date();
  target.setDate(target.getDate() + daysLeft);
  return format(target, 'MMM d, yyyy');
}

export function getDayCompletionRate(tasks: Task[], dateKey: string): number {
  const activeTasks = tasks.filter((t) => t.frequency !== 'longterm');
  if (activeTasks.length === 0) return 0;
  const completed = activeTasks.filter((t) => t.completions[dateKey]).length;
  return Math.round((completed / activeTasks.length) * 100);
}
