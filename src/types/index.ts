export type TaskFrequency = 'daily' | 'weekly' | 'monthly' | 'longterm';
export type TaskPriority = 'low' | 'medium' | 'high';
export type LongtermStatus = 'not_started' | 'in_progress' | 'completed' | 'paused';

export interface Task {
  id: string;
  title: string;
  frequency: TaskFrequency;
  priority: TaskPriority;
  createdAt: string; // ISO date string

  // For daily/weekly/monthly tasks
  completions: Record<string, boolean>; // key: YYYY-MM-DD, value: done

  // For tasks with a numeric goal (e.g. read 300 pages, 10 pages/day)
  totalAmount?: number;
  dailyGoalAmount?: number;
  unit?: string; // e.g. "pages", "minutes"

  // For long-term tasks
  longtermStatus?: LongtermStatus;
  dueDate?: string; // ISO date string (manually set or auto-calculated)

  notes?: string;
}

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface MoodEntry {
  date: string; // YYYY-MM-DD
  mood: MoodLevel;
  note?: string;
}

// Daily Scheduler
export interface TimeBlock {
  id: string;
  startTime: string; // 'HH:mm' 24h
  endTime: string;   // 'HH:mm' 24h
  activity: string;
  color?: string;    // optional accent color hex
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  blocks: TimeBlock[];
  createdAt: string; // ISO datetime string
}

// Maps a day-of-week (0=Sun … 6=Sat) or a specific date (YYYY-MM-DD) to a template id.
// Specific dates take priority over day-of-week defaults.
export interface DayAssignment {
  // day-of-week defaults: key is '0'…'6'
  weekdays: Record<string, string>; // dow string -> templateId
  // specific date overrides: key is 'YYYY-MM-DD'
  dates: Record<string, string>;    // dateKey -> templateId
}
