import React, { createContext, useContext, useEffect, useState } from 'react';
import { MoodEntry } from '../types';
import { loadMoodEntries, saveMoodEntry } from '../storage/mood';

interface MoodContextValue {
  moodEntries: MoodEntry[];
  upsertMood: (entry: MoodEntry) => Promise<void>;
  reloadMood: () => Promise<void>;
}

const MoodContext = createContext<MoodContextValue>({
  moodEntries: [],
  upsertMood: async () => {},
  reloadMood: async () => {},
});

export function MoodProvider({ children }: { children: React.ReactNode }) {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);

  const reloadMood = async () => {
    const entries = await loadMoodEntries();
    setMoodEntries(entries);
  };

  useEffect(() => {
    reloadMood();
  }, []);

  const upsertMood = async (entry: MoodEntry) => {
    const updated = await saveMoodEntry(entry);
    setMoodEntries(updated);
  };

  return (
    <MoodContext.Provider value={{ moodEntries, upsertMood, reloadMood }}>
      {children}
    </MoodContext.Provider>
  );
}

export function useMood() {
  return useContext(MoodContext);
}
