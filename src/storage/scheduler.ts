import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScheduleTemplate, DayAssignment } from '../types';

const TEMPLATES_KEY = '@life_tracker_schedule_templates';
const ASSIGNMENTS_KEY = '@life_tracker_schedule_assignments';

// ── Templates ────────────────────────────────────────────────────────────────

export async function loadTemplates(): Promise<ScheduleTemplate[]> {
  try {
    const raw = await AsyncStorage.getItem(TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveTemplates(templates: ScheduleTemplate[]): Promise<void> {
  await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

export async function addTemplate(template: ScheduleTemplate): Promise<ScheduleTemplate[]> {
  const templates = await loadTemplates();
  const updated = [...templates, template];
  await saveTemplates(updated);
  return updated;
}

export async function updateTemplate(updated: ScheduleTemplate): Promise<ScheduleTemplate[]> {
  const templates = await loadTemplates();
  const next = templates.map((t) => (t.id === updated.id ? updated : t));
  await saveTemplates(next);
  return next;
}

export async function deleteTemplate(id: string): Promise<ScheduleTemplate[]> {
  const templates = await loadTemplates();
  const next = templates.filter((t) => t.id !== id);
  await saveTemplates(next);
  // Also clean up any assignments pointing to this template
  const assignments = await loadAssignments();
  const cleanedWeekdays = Object.fromEntries(
    Object.entries(assignments.weekdays).filter(([, tid]) => tid !== id)
  );
  const cleanedDates = Object.fromEntries(
    Object.entries(assignments.dates).filter(([, tid]) => tid !== id)
  );
  await saveAssignments({ weekdays: cleanedWeekdays, dates: cleanedDates });
  return next;
}

// ── Assignments ───────────────────────────────────────────────────────────────

const DEFAULT_ASSIGNMENTS: DayAssignment = { weekdays: {}, dates: {} };

export async function loadAssignments(): Promise<DayAssignment> {
  try {
    const raw = await AsyncStorage.getItem(ASSIGNMENTS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_ASSIGNMENTS;
  } catch {
    return DEFAULT_ASSIGNMENTS;
  }
}

export async function saveAssignments(assignments: DayAssignment): Promise<void> {
  await AsyncStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
}

export async function assignWeekday(dow: number, templateId: string | null): Promise<DayAssignment> {
  const assignments = await loadAssignments();
  const next: DayAssignment = {
    ...assignments,
    weekdays: { ...assignments.weekdays },
  };
  if (templateId === null) {
    delete next.weekdays[String(dow)];
  } else {
    next.weekdays[String(dow)] = templateId;
  }
  await saveAssignments(next);
  return next;
}

export async function assignDate(dateKey: string, templateId: string | null): Promise<DayAssignment> {
  const assignments = await loadAssignments();
  const next: DayAssignment = {
    ...assignments,
    dates: { ...assignments.dates },
  };
  if (templateId === null) {
    delete next.dates[dateKey];
  } else {
    next.dates[dateKey] = templateId;
  }
  await saveAssignments(next);
  return next;
}

// Returns the effective templateId for a given date string ('YYYY-MM-DD'),
// preferring a specific date assignment over the day-of-week default.
export function resolveTemplate(
  assignments: DayAssignment,
  templates: ScheduleTemplate[],
  dateKey: string,
): ScheduleTemplate | null {
  // Specific date override takes priority
  const byDate = assignments.dates[dateKey];
  if (byDate) {
    return templates.find((t) => t.id === byDate) ?? null;
  }
  // Fall back to day-of-week
  const dow = new Date(dateKey + 'T00:00:00').getDay(); // 0=Sun
  const byDow = assignments.weekdays[String(dow)];
  if (byDow) {
    return templates.find((t) => t.id === byDow) ?? null;
  }
  return null;
}
