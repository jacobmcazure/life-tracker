import React, { createContext, useContext, useEffect, useState } from 'react';
import { Task, MoodEntry } from '../types';
import { loadTasks, saveTasks } from '../storage/tasks';
import { loadMoodEntries, saveMoodEntry } from '../storage/mood';

interface TasksContextValue {
  tasks: Task[];
  moodEntries: MoodEntry[];
  setTasks: (tasks: Task[]) => void;
  reloadTasks: () => Promise<void>;
  upsertMood: (entry: MoodEntry) => Promise<void>;
}

const TasksContext = createContext<TasksContextValue>({
  tasks: [],
  moodEntries: [],
  setTasks: () => {},
  reloadTasks: async () => {},
  upsertMood: async () => {},
});

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasksState] = useState<Task[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);

  const reloadTasks = async () => {
    const [t, m] = await Promise.all([loadTasks(), loadMoodEntries()]);
    setTasksState(t);
    setMoodEntries(m);
  };

  useEffect(() => {
    reloadTasks();
  }, []);

  const setTasks = async (updated: Task[]) => {
    setTasksState(updated);
    await saveTasks(updated);
  };

  const upsertMood = async (entry: MoodEntry) => {
    const updated = await saveMoodEntry(entry);
    setMoodEntries(updated);
  };

  return (
    <TasksContext.Provider value={{ tasks, moodEntries, setTasks, reloadTasks, upsertMood }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  return useContext(TasksContext);
}
