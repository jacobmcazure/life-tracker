import { Theme } from './types';

/* ══════════════════════════════════════════════════════════════════════
   Theme 1 — Vibrant Sanctuary (default)
   The flagship editorial palette: warm cream canvas, deep emerald
   authority, terracotta energy, lavender intellect.
   ══════════════════════════════════════════════════════════════════════ */

export const vibrantSanctuaryTheme: Theme = {
  id: 'vibrant-sanctuary',
  name: 'Vibrant Sanctuary',
  preview: {
    swatch: ['#2d6a4f', '#fc9174', '#575d84'],
    subtitle: 'Active Experience',
  },
  colors: {
    // Legacy tokens (mapped to design-system equivalents)
    bg: '#fbf9f5',
    card: '#ffffff',
    text: '#1b1c1a',
    muted: '#707973',
    primary: '#0f5238',
    headerBg: '#0f5238',
    headerText: '#ffffff',
    border: '#bfc9c1',
    inputBg: '#f5f3ef',
    accent: '#2d6a4f',
    dangerBg: '#ffdad6',
    dangerText: '#ba1a1a',

    // Surface layers
    surface: '#fbf9f5',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f5f3ef',
    surfaceContainer: '#efeeea',
    surfaceContainerHigh: '#eae8e4',
    surfaceContainerHighest: '#e4e2de',

    // Color roles
    onSurface: '#1b1c1a',
    onSurfaceVariant: '#404943',
    primaryContainer: '#2d6a4f',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#a8e7c5',
    secondary: '#9a442d',
    secondaryContainer: '#fc9174',
    onSecondary: '#ffffff',
    tertiary: '#3f456b',
    tertiaryContainer: '#575d84',
    onTertiary: '#ffffff',
    tertiaryFixed: '#dee0ff',
    tertiaryFixedDim: '#bec4f1',
    secondaryFixed: '#ffdbd2',
    outline: '#707973',
    outlineVariant: '#bfc9c1',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    onError: '#ffffff',
    inverseSurface: '#30312e',
    inverseOnSurface: '#f2f0ed',
  },
};

/* ══════════════════════════════════════════════════════════════════════
   Theme 2 — Serene Sage
   Muted greens & stone — a quieter, earth-toned variant.
   ══════════════════════════════════════════════════════════════════════ */

export const sereneSageTheme: Theme = {
  id: 'serene-sage',
  name: 'Serene Sage',
  preview: {
    swatch: ['#5d6d5e', '#8a9a8b', '#d1d7d1'],
    subtitle: 'Muted Greens & Stone',
  },
  colors: {
    bg: '#f7f6f2',
    card: '#ffffff',
    text: '#1c1f1c',
    muted: '#6b7369',
    primary: '#3d5a40',
    headerBg: '#3d5a40',
    headerText: '#ffffff',
    border: '#c4ccc4',
    inputBg: '#f0eeea',
    accent: '#5d6d5e',
    dangerBg: '#ffdad6',
    dangerText: '#ba1a1a',

    surface: '#f7f6f2',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f0eeea',
    surfaceContainer: '#eae8e4',
    surfaceContainerHigh: '#e3e2de',
    surfaceContainerHighest: '#dddcd8',

    onSurface: '#1c1f1c',
    onSurfaceVariant: '#434843',
    primaryContainer: '#5d6d5e',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#c8dac9',
    secondary: '#7a6e5d',
    secondaryContainer: '#c4b69e',
    onSecondary: '#ffffff',
    tertiary: '#586258',
    tertiaryContainer: '#8a9a8b',
    onTertiary: '#ffffff',
    tertiaryFixed: '#d1d7d1',
    tertiaryFixedDim: '#b8c0b8',
    secondaryFixed: '#e8ddd0',
    outline: '#6b7369',
    outlineVariant: '#c4ccc4',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    onError: '#ffffff',
    inverseSurface: '#2f312f',
    inverseOnSurface: '#f0f1ed',
  },
};

/* ══════════════════════════════════════════════════════════════════════
   Theme 3 — Nordic Mist
   Soft blue & cool grays — crisp Scandinavian minimalism.
   ══════════════════════════════════════════════════════════════════════ */

export const nordicMistTheme: Theme = {
  id: 'nordic-mist',
  name: 'Nordic Mist',
  preview: {
    swatch: ['#4a5568', '#a0aec0', '#edf2f7'],
    subtitle: 'Soft Blue & Cool Grays',
  },
  colors: {
    bg: '#f8f9fb',
    card: '#ffffff',
    text: '#1a202c',
    muted: '#718096',
    primary: '#2d3748',
    headerBg: '#2d3748',
    headerText: '#ffffff',
    border: '#cbd5e0',
    inputBg: '#edf2f7',
    accent: '#4a5568',
    dangerBg: '#fed7d7',
    dangerText: '#c53030',

    surface: '#f8f9fb',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#edf2f7',
    surfaceContainer: '#e2e8f0',
    surfaceContainerHigh: '#dae0e8',
    surfaceContainerHighest: '#cbd5e0',

    onSurface: '#1a202c',
    onSurfaceVariant: '#4a5568',
    primaryContainer: '#4a5568',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#cbd5e0',
    secondary: '#5a6878',
    secondaryContainer: '#a0aec0',
    onSecondary: '#ffffff',
    tertiary: '#4c5c7a',
    tertiaryContainer: '#7e8fb0',
    onTertiary: '#ffffff',
    tertiaryFixed: '#e2e8f0',
    tertiaryFixedDim: '#c3cfe0',
    secondaryFixed: '#e2e8f0',
    outline: '#718096',
    outlineVariant: '#cbd5e0',
    error: '#c53030',
    errorContainer: '#fed7d7',
    onError: '#ffffff',
    inverseSurface: '#1a202c',
    inverseOnSurface: '#edf2f7',
  },
};

/* ══════════════════════════════════════════════════════════════════════
   Theme 4 — High Contrast
   Deep greens & sharp white — maximum readability.
   ══════════════════════════════════════════════════════════════════════ */

export const highContrastTheme: Theme = {
  id: 'high-contrast',
  name: 'High Contrast',
  preview: {
    swatch: ['#000000', '#ffffff', '#1a202c'],
    subtitle: 'Deep Greens & Sharp White',
  },
  colors: {
    bg: '#ffffff',
    card: '#f7f7f7',
    text: '#0a0a0a',
    muted: '#4a4a4a',
    primary: '#0a3d26',
    headerBg: '#0a3d26',
    headerText: '#ffffff',
    border: '#d0d0d0',
    inputBg: '#f0f0f0',
    accent: '#0a3d26',
    dangerBg: '#fde8e8',
    dangerText: '#9b1c1c',

    surface: '#ffffff',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f5f5f5',
    surfaceContainer: '#ebebeb',
    surfaceContainerHigh: '#e0e0e0',
    surfaceContainerHighest: '#d4d4d4',

    onSurface: '#0a0a0a',
    onSurfaceVariant: '#2d2d2d',
    primaryContainer: '#0a3d26',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#b0e8cc',
    secondary: '#1a1a1a',
    secondaryContainer: '#4a4a4a',
    onSecondary: '#ffffff',
    tertiary: '#1a202c',
    tertiaryContainer: '#2d3748',
    onTertiary: '#ffffff',
    tertiaryFixed: '#e2e8f0',
    tertiaryFixedDim: '#c3cfe0',
    secondaryFixed: '#e8e8e8',
    outline: '#4a4a4a',
    outlineVariant: '#d0d0d0',
    error: '#9b1c1c',
    errorContainer: '#fde8e8',
    onError: '#ffffff',
    inverseSurface: '#0a0a0a',
    inverseOnSurface: '#f5f5f5',
  },
};

/* ══════════════════════════════════════════════════════════════════════
   Registry
   ══════════════════════════════════════════════════════════════════════ */

export const BUILT_IN_THEMES: Theme[] = [
  vibrantSanctuaryTheme,
  sereneSageTheme,
  nordicMistTheme,
  highContrastTheme,
];

export function getThemeById(id: string): Theme {
  return BUILT_IN_THEMES.find((t) => t.id === id) ?? vibrantSanctuaryTheme;
}
