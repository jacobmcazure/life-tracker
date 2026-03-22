import { StyleSheet, TextStyle, ViewStyle } from 'react-native';

/**
 * Shared bottom inset for tab bar spacing.
 * Use as paddingBottom in ScrollView content or as a spacer View height.
 */
export const TAB_BAR_BOTTOM_INSET = 130;

/**
 * Shared typography styles used across all Sanctuary screens.
 * Color is intentionally omitted — apply via inline style with theme tokens.
 */
export const typography = StyleSheet.create({
  /** Uppercase micro-label above hero headlines (e.g. "A NEW DAWN", "DAILY CHECK-IN") */
  eyebrow: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 8,
  } as TextStyle,

  /** Large italic headline (e.g. screen title, month name) */
  heroTitle: {
    fontFamily: 'Newsreader_400Regular_Italic',
    fontSize: 38,
    lineHeight: 44,
  } as TextStyle,

  /** Section divider label (e.g. "TODAY'S MOMENTS", "ACHIEVEMENTS") */
  sectionLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 16,
  } as TextStyle,
});

/**
 * Shared card container styles.
 * Apply backgroundColor and shadowColor via inline style with theme tokens.
 */
export const cards = StyleSheet.create({
  /** Standard elevated card */
  base: {
    borderRadius: 16,
    padding: 20,
    shadowOpacity: 0.02,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  } as ViewStyle,

  /** Full-width banner card (insights, trends, support) */
  banner: {
    borderRadius: 16,
    padding: 28,
    overflow: 'hidden',
    position: 'relative',
  } as ViewStyle,
});

/**
 * Common layout patterns.
 */
export const layout = StyleSheet.create({
  /** Full-screen root container */
  root: {
    flex: 1,
  } as ViewStyle,

  /** Standard scroll content padding */
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: TAB_BAR_BOTTOM_INSET,
  } as ViewStyle,
});
