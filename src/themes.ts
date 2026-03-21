import { Theme } from './types';

export const lightTheme: Theme = {
  id: 'light',
  name: 'Light',
  colors: {
    bg: '#f0f4f8',
    card: '#fff',
    text: '#1a237e',
    muted: '#888',
    primary: '#1a237e',
    headerBg: '#1a237e',
    headerText: '#fff',
    border: '#e8eaf6',
    inputBg: '#f5f5f5',
    accent: '#64ffda',
    dangerBg: '#fdecea',
    dangerText: '#c62828',
  },
};

export const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark',
  colors: {
    bg: '#121212',
    card: '#1e1e1e',
    text: '#e0e0e0',
    muted: '#888',
    primary: '#7986cb',
    headerBg: '#1a237e',
    headerText: '#fff',
    border: '#333',
    inputBg: '#2a2a2a',
    accent: '#64ffda',
    dangerBg: '#3e1a1a',
    dangerText: '#ef5350',
  },
};

export const BUILT_IN_THEMES: Theme[] = [lightTheme, darkTheme];

export function getThemeById(id: string): Theme {
  return BUILT_IN_THEMES.find((t) => t.id === id) ?? lightTheme;
}
