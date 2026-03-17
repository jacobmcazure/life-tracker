import AsyncStorage from '@react-native-async-storage/async-storage';
import { MoodEntry } from '../types';

const MOOD_KEY = '@life_tracker_mood';

export async function loadMoodEntries(): Promise<MoodEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(MOOD_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveMoodEntry(entry: MoodEntry): Promise<MoodEntry[]> {
  const entries = await loadMoodEntries();
  const existing = entries.findIndex((e) => e.date === entry.date);
  let next: MoodEntry[];
  if (existing >= 0) {
    next = entries.map((e, i) => (i === existing ? entry : e));
  } else {
    next = [...entries, entry];
  }
  await AsyncStorage.setItem(MOOD_KEY, JSON.stringify(next));
  return next;
}
