// ── Theme ─────────────────────────────────────────────────────────────────────

export interface ThemeColors {
  // ── Legacy tokens (used by existing screens) ──
  bg: string;
  card: string;
  text: string;
  muted: string;
  primary: string;
  headerBg: string;
  headerText: string;
  border: string;
  inputBg: string;
  accent: string;
  dangerBg: string;
  dangerText: string;

  // ── Design-system surface layers ──
  surface: string;
  surfaceContainerLowest: string;   // #ffffff – floating cards
  surfaceContainerLow: string;      // #f5f3ef – section backgrounds
  surfaceContainer: string;         // #efeeea – hover states
  surfaceContainerHigh: string;     // #eae8e4 – elevated surfaces
  surfaceContainerHighest: string;  // #e4e2de – high-density areas

  // ── Design-system color roles ──
  onSurface: string;
  onSurfaceVariant: string;
  primaryContainer: string;
  onPrimary: string;
  onPrimaryContainer: string;
  secondary: string;
  secondaryContainer: string;
  onSecondary: string;
  tertiary: string;
  tertiaryContainer: string;
  onTertiary: string;
  tertiaryFixed: string;
  tertiaryFixedDim: string;
  secondaryFixed: string;
  outline: string;
  outlineVariant: string;
  error: string;
  errorContainer: string;
  onError: string;
  inverseSurface: string;
  inverseOnSurface: string;
}

/** Display metadata for theme selection cards */
export interface ThemePreview {
  swatch: [string, string, string]; // three preview colors
  subtitle: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  preview: ThemePreview;
}

// ── Mood ──────────────────────────────────────────────────────────────────────

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface MoodEntry {
  date: string; // YYYY-MM-DD
  mood: MoodLevel;
  note?: string;
}

// ── Daily Scheduler ───────────────────────────────────────────────────────────

export interface TimeBlock {
  id: string;
  startTime: string; // 'HH:mm' 24h
  endTime: string;   // 'HH:mm' 24h
  activity: string;
  color?: string;    // optional accent color hex
  tracked?: boolean; // if true, shown on Dashboard and counted for completion stats
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
  weekdays: Record<string, string>; // dow string -> templateId
  dates: Record<string, string>;    // dateKey -> templateId
}

// ── Block Completions ─────────────────────────────────────────────────────────

// Outer key: date string 'YYYY-MM-DD'
// Inner key: TimeBlock id
// Value: true if completed
export type BlockCompletions = Record<string, Record<string, boolean>>;

// ── Day Notes (Journal) ───────────────────────────────────────────────────────

export interface DayNote {
  date: string; // YYYY-MM-DD
  text: string;
}

// ── Settings ──────────────────────────────────────────────────────────────────

export interface UserSettings {
  displayName: string;
  dateJoined: string;       // ISO date string, set once on first launch
  activeThemeId: string;    // references a Theme.id (e.g. 'light', 'dark')
}
