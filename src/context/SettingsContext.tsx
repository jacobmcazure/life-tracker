import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserSettings, ThemeMode } from '../types';
import { loadSettings, saveSettings } from '../storage/settings';

interface SettingsContextValue {
  settings: UserSettings;
  ready: boolean;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: {
    displayName: '',
    dateJoined: '',
    theme: 'light',
  },
  ready: false,
  updateSettings: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>({
    displayName: '',
    dateJoined: '',
    theme: 'light',
  });
  const [ready, setReady] = useState(false);

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
    <SettingsContext.Provider value={{ settings, ready, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
