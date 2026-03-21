import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { UserSettings, Theme } from '../types';
import { loadSettings, saveSettings } from '../storage/settings';
import { getThemeById } from '../themes';

interface SettingsContextValue {
  settings: UserSettings;
  theme: Theme;
  ready: boolean;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: {
    displayName: '',
    dateJoined: '',
    activeThemeId: 'light',
  },
  theme: getThemeById('light'),
  ready: false,
  updateSettings: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>({
    displayName: '',
    dateJoined: '',
    activeThemeId: 'light',
  });
  const [ready, setReady] = useState(false);

  const theme = useMemo(() => getThemeById(settings.activeThemeId), [settings.activeThemeId]);

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      setReady(true);
    });
  }, []);

  const updateSettings = async (patch: Partial<UserSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    await saveSettings(next);
  };

  return (
    <SettingsContext.Provider value={{ settings, theme, ready, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

/** Convenience hook — returns the resolved Theme object. */
export function useTheme(): Theme {
  const { theme } = useContext(SettingsContext);
  return theme;
}
