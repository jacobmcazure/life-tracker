import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings } from '../types';
import { format } from 'date-fns';

const SETTINGS_KEY = '@life_tracker_settings';

const DEFAULT_SETTINGS: UserSettings = {
  displayName: '',
  dateJoined: format(new Date(), 'yyyy-MM-dd'),
  activeThemeId: 'light',
};

export async function loadSettings(): Promise<UserSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Backward compat: migrate old 'theme' field to 'activeThemeId'
      if (parsed.theme && !parsed.activeThemeId) {
        parsed.activeThemeId = parsed.theme;
        delete parsed.theme;
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
    await saveSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
