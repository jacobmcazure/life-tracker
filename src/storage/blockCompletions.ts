import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlockCompletions } from '../types';

const KEY = '@life_tracker_block_completions';

export async function loadBlockCompletions(): Promise<BlockCompletions> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveBlockCompletions(data: BlockCompletions): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}

export async function toggleBlockCompletion(
  dateKey: string,
  blockId: string,
): Promise<BlockCompletions> {
  const all = await loadBlockCompletions();
  const dayData = all[dateKey] ?? {};
  const updated: BlockCompletions = {
    ...all,
    [dateKey]: {
      ...dayData,
      [blockId]: !dayData[blockId],
    },
  };
  await saveBlockCompletions(updated);
  return updated;
}
