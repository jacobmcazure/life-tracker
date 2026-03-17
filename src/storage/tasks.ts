import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../types';

const TASKS_KEY = '@life_tracker_tasks';

export async function loadTasks(): Promise<Task[]> {
  try {
    const raw = await AsyncStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export async function addTask(task: Task): Promise<Task[]> {
  const tasks = await loadTasks();
  const updated = [...tasks, task];
  await saveTasks(updated);
  return updated;
}

export async function updateTask(updated: Task): Promise<Task[]> {
  const tasks = await loadTasks();
  const next = tasks.map((t) => (t.id === updated.id ? updated : t));
  await saveTasks(next);
  return next;
}

export async function deleteTask(id: string): Promise<Task[]> {
  const tasks = await loadTasks();
  const next = tasks.filter((t) => t.id !== id);
  await saveTasks(next);
  return next;
}
