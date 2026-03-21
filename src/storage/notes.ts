import AsyncStorage from '@react-native-async-storage/async-storage';
import { DayNote } from '../types';

const KEY = '@life_tracker_day_notes';

export async function loadDayNotes(): Promise<DayNote[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveDayNotes(notes: DayNote[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(notes));
}

export async function upsertDayNote(dateKey: string, text: string): Promise<DayNote[]> {
  const notes = await loadDayNotes();
  const idx = notes.findIndex((n) => n.date === dateKey);
  let updated: DayNote[];
  if (idx >= 0) {
    updated = notes.map((n, i) => (i === idx ? { date: dateKey, text } : n));
  } else {
    updated = [...notes, { date: dateKey, text }];
  }
  await saveDayNotes(updated);
  return updated;
}
