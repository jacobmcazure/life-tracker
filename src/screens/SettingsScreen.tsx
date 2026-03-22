import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { format, differenceInDays, parseISO, subDays } from 'date-fns';
import { useSettings, useTheme } from '../context/SettingsContext';
import { useScheduler } from '../context/SchedulerContext';
import { useMood } from '../context/MoodContext';
import { resolveTemplate } from '../storage/scheduler';
import { todayKey, getDayCompletionRate } from '../utils/dates';
import { BUILT_IN_THEMES } from '../themes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScheduleTemplate, DayAssignment, BlockCompletions } from '../types';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Compute the current daily-completion streak ending today (or yesterday). */
function computeStreak(
  templates: ScheduleTemplate[],
  assignments: DayAssignment,
  blockCompletions: BlockCompletions,
): number {
  let streak = 0;
  const today = new Date();
  for (let offset = 0; offset < 365; offset++) {
    const d = subDays(today, offset);
    const key = format(d, 'yyyy-MM-dd');
    const template = resolveTemplate(assignments, templates, key);
    if (!template || template.blocks.length === 0) {
      if (offset === 0) continue; // today with no schedule doesn't break streak
      break; // past day with no schedule breaks the streak
    }
    const trackedBlocks = template.blocks.filter((b) => b.tracked);
    if (trackedBlocks.length === 0) {
      if (offset === 0) continue;
      break;
    }
    const dayData = blockCompletions[key] ?? {};
    const allDone = trackedBlocks.every((b) => dayData[b.id]);
    if (allDone) {
      streak++;
    } else if (offset === 0) {
      continue; // today isn't done yet, keep checking
    } else {
      break;
    }
  }
  return streak;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SettingsScreen() {
  const { settings, updateSettings } = useSettings();
  const theme = useTheme();
  const { colors } = theme;
  const { templates, assignments, blockCompletions } = useScheduler();
  const { moodEntries } = useMood();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(settings.displayName);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // --- derived stats ---
  const streak = useMemo(
    () => computeStreak(templates, assignments, blockCompletions),
    [templates, assignments, blockCompletions],
  );

  const today = todayKey();
  const todayTemplate = useMemo(
    () => resolveTemplate(assignments, templates, today),
    [assignments, templates, today],
  );
  const todayTrackedBlocks = todayTemplate
    ? todayTemplate.blocks.filter((b) => b.tracked)
    : [];
  const todayBlocks = todayTrackedBlocks.length;
  const todayDone = useMemo(() => {
    if (!todayTemplate) return 0;
    const dayData = blockCompletions[today] ?? {};
    return todayTrackedBlocks.filter((b) => dayData[b.id]).length;
  }, [todayTemplate, blockCompletions, today]);

  const totalCompletions = useMemo(
    () =>
      Object.values(blockCompletions).reduce(
        (sum, dayData) => sum + Object.values(dayData).filter(Boolean).length,
        0,
      ),
    [blockCompletions],
  );

  const memberDays = settings.dateJoined
    ? differenceInDays(new Date(), parseISO(settings.dateJoined)) + 1
    : 0;

  const dateJoinedDisplay = settings.dateJoined
    ? format(parseISO(settings.dateJoined), 'MMMM d, yyyy')
    : '--';

  // --- actions ---
  const saveName = async () => {
    await updateSettings({ displayName: nameDraft.trim() });
    setEditingName(false);
  };

  const confirmClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all completions, mood entries, schedules, notes, and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Done', 'All data has been cleared. Restart the app for a fresh start.');
          },
        },
      ],
    );
  };

  /* ---------------------------------------------------------------- */
  /*  Main render                                                      */
  /* ---------------------------------------------------------------- */

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.surface }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  Hero — Appearance                                            */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <View style={styles.heroSection}>
        <Text
          style={[
            styles.sectionLabel,
            { color: colors.secondary },
          ]}
        >
          PERSONALIZATION
        </Text>
        <Text
          style={[
            styles.heroTitle,
            { color: colors.primary },
          ]}
        >
          Appearance
        </Text>
      </View>

      {/* Theme grid — 2 columns */}
      <View style={styles.themeGrid}>
        {BUILT_IN_THEMES.map((t) => {
          const isActive = settings.activeThemeId === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              activeOpacity={0.7}
              style={[
                styles.themeCard,
                {
                  backgroundColor: isActive
                    ? colors.surfaceContainerLowest
                    : colors.surfaceContainerLow,
                  borderWidth: isActive ? 2 : 1,
                  borderColor: isActive
                    ? colors.primaryContainer
                    : colors.outlineVariant + '1A',
                },
              ]}
              onPress={() => updateSettings({ activeThemeId: t.id })}
            >
              {/* Checkmark indicator */}
              {isActive && (
                <View
                  style={[
                    styles.checkmarkBadge,
                    { backgroundColor: colors.primaryContainer },
                  ]}
                >
                  <Text style={[styles.checkmarkText, { color: colors.onPrimary }]}>
                    {'✓'}
                  </Text>
                </View>
              )}

              {/* Swatch row */}
              <View style={styles.swatchRow}>
                {t.preview.swatch.map((swatchColor, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.swatch,
                      { backgroundColor: swatchColor },
                    ]}
                  />
                ))}
              </View>

              {/* Theme name */}
              <Text
                style={[
                  styles.themeCardName,
                  { color: colors.onSurface },
                ]}
                numberOfLines={1}
              >
                {t.name}
              </Text>

              {/* Subtitle */}
              <Text
                style={[
                  styles.themeCardSubtitle,
                  { color: colors.onSurfaceVariant },
                ]}
                numberOfLines={1}
              >
                {t.preview.subtitle}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  Account & Security                                           */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <Text
        style={[
          styles.sectionHeader,
          { color: colors.onSurface + '80' },
        ]}
      >
        ACCOUNT & SECURITY
      </Text>

      {/* Profile Information */}
      {editingName ? (
        <View
          style={[
            styles.settingsRow,
            { backgroundColor: colors.surfaceContainerLow + '66' },
          ]}
        >
          <View style={styles.nameEditContainer}>
            <TextInput
              style={[
                styles.nameInput,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  color: colors.onSurface,
                  borderColor: colors.outlineVariant + '33',
                },
              ]}
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Enter your name"
              placeholderTextColor={colors.onSurfaceVariant}
              autoFocus
              onSubmitEditing={saveName}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={saveName}
            >
              <Text style={[styles.saveButtonText, { color: colors.onPrimary }]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.settingsRow,
            { backgroundColor: colors.surfaceContainerLow + '66' },
          ]}
          onPress={() => {
            setNameDraft(settings.displayName);
            setEditingName(true);
          }}
        >
          <View
            style={[
              styles.rowIcon,
              { backgroundColor: colors.tertiaryFixedDim + '4D' },
            ]}
          />
          <View style={styles.rowTextColumn}>
            <Text style={[styles.rowTitle, { color: colors.onSurface }]}>
              Profile Information
            </Text>
            <Text style={[styles.rowSubtitle, { color: colors.onSurfaceVariant }]}>
              {settings.displayName || 'Tap to set your name'}
            </Text>
          </View>
          <Text style={[styles.chevron, { color: colors.onSurfaceVariant }]}>
            {'>'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Password & Security */}
      <View
        style={[
          styles.settingsRow,
          { backgroundColor: colors.surfaceContainerLow + '66', marginTop: 8 },
        ]}
      >
        <View
          style={[
            styles.rowIcon,
            { backgroundColor: colors.tertiaryFixed + '4D' },
          ]}
        />
        <View style={styles.rowTextColumn}>
          <Text style={[styles.rowTitle, { color: colors.onSurface }]}>
            Password & Security
          </Text>
          <Text style={[styles.rowSubtitle, { color: colors.onSurfaceVariant }]}>
            Joined {dateJoinedDisplay}
          </Text>
        </View>
        <Text style={[styles.chevron, { color: colors.onSurfaceVariant }]}>
          {'>'}
        </Text>
      </View>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  Your Journey — Stats                                         */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <Text
        style={[
          styles.sectionHeader,
          { color: colors.onSurface + '80' },
        ]}
      >
        YOUR JOURNEY
      </Text>

      <View style={styles.statsGrid}>
        {/* Streak */}
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {streak}
          </Text>
          <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            Day Streak
          </Text>
        </View>

        {/* Today's Progress */}
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {todayDone}/{todayBlocks}
          </Text>
          <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            Today's Blocks
          </Text>
        </View>

        {/* Total Completions */}
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {totalCompletions}
          </Text>
          <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            Completions
          </Text>
        </View>

        {/* Templates */}
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {templates.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            Templates
          </Text>
        </View>

        {/* Mood Entries */}
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {moodEntries.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            Mood Entries
          </Text>
        </View>

        {/* Member Days */}
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {memberDays}
          </Text>
          <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            {memberDays === 1 ? 'Day Active' : 'Days Active'}
          </Text>
        </View>
      </View>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  Preferences                                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <Text
        style={[
          styles.sectionHeader,
          { color: colors.onSurface + '80' },
        ]}
      >
        PREFERENCES
      </Text>

      {/* Push Notifications */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.settingsRow,
          { backgroundColor: colors.surfaceContainerLow + '66' },
        ]}
        onPress={() => setNotificationsEnabled((prev) => !prev)}
      >
        <View
          style={[
            styles.rowIcon,
            { backgroundColor: colors.tertiaryFixedDim + '4D' },
          ]}
        />
        <View style={styles.rowTextColumn}>
          <Text style={[styles.rowTitle, { color: colors.onSurface }]}>
            Push Notifications
          </Text>
          <Text style={[styles.rowSubtitle, { color: colors.onSurfaceVariant }]}>
            {notificationsEnabled ? 'Enabled' : 'Disabled'}
          </Text>
        </View>

        {/* Custom toggle */}
        <View
          style={[
            styles.toggleTrack,
            {
              backgroundColor: notificationsEnabled
                ? colors.primary
                : colors.outlineVariant,
            },
          ]}
        >
          <View
            style={[
              styles.toggleThumb,
              {
                transform: [
                  { translateX: notificationsEnabled ? 22 : 0 },
                ],
              },
            ]}
          />
        </View>
      </TouchableOpacity>

      {/* Privacy Policy */}
      <View
        style={[
          styles.settingsRow,
          { backgroundColor: colors.surfaceContainerLow + '66', marginTop: 8 },
        ]}
      >
        <View
          style={[
            styles.rowIcon,
            { backgroundColor: colors.tertiaryFixed + '4D' },
          ]}
        />
        <View style={styles.rowTextColumn}>
          <Text style={[styles.rowTitle, { color: colors.onSurface }]}>
            Privacy Policy
          </Text>
          <Text style={[styles.rowSubtitle, { color: colors.onSurfaceVariant }]}>
            How we handle your data
          </Text>
        </View>
        <Text style={[styles.chevron, { color: colors.onSurfaceVariant }]}>
          {'>'}
        </Text>
      </View>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  Data                                                         */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <Text
        style={[
          styles.sectionHeader,
          { color: colors.onSurface + '80' },
        ]}
      >
        DATA
      </Text>

      <TouchableOpacity
        activeOpacity={0.7}
        style={[
          styles.settingsRow,
          { backgroundColor: colors.errorContainer + '66' },
        ]}
        onPress={confirmClearData}
      >
        <View
          style={[
            styles.rowIcon,
            { backgroundColor: colors.error + '26' },
          ]}
        />
        <View style={styles.rowTextColumn}>
          <Text style={[styles.rowTitle, { color: colors.error }]}>
            Clear All Data
          </Text>
          <Text style={[styles.rowSubtitle, { color: colors.error + 'AA' }]}>
            Permanently remove everything
          </Text>
        </View>
        <Text style={[styles.chevron, { color: colors.error }]}>
          {'>'}
        </Text>
      </TouchableOpacity>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  Support Banner                                               */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <View
        style={[
          styles.supportBanner,
          { backgroundColor: colors.primary },
        ]}
      >
        {/* Decorative background element */}
        <Text
          style={[
            styles.supportBannerDecor,
            { color: colors.onPrimary },
          ]}
        >
          {'?'}
        </Text>

        <Text
          style={[
            styles.supportBannerHeadline,
            { color: colors.onPrimary },
          ]}
        >
          Need a Guide?
        </Text>
        <Text
          style={[
            styles.supportBannerBody,
            { color: colors.onPrimary },
          ]}
        >
          Our team is here to help you make the most of your sanctuary. Reach out anytime.
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.supportBannerButton,
            { backgroundColor: colors.secondary },
          ]}
        >
          <Text
            style={[
              styles.supportBannerButtonText,
              { color: colors.onSecondary },
            ]}
          >
            Contact Support
          </Text>
        </TouchableOpacity>
      </View>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  About                                                        */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <View style={styles.aboutSection}>
        <Text style={[styles.aboutAppName, { color: colors.onSurface }]}>
          Life Tracker
        </Text>
        <Text style={[styles.aboutVersion, { color: colors.onSurfaceVariant }]}>
          {'Version 1.0.0 \u00B7 Expo / React Native'}
        </Text>
      </View>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  Logout Button                                                */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <View style={styles.logoutContainer}>
        <TouchableOpacity
          activeOpacity={0.6}
          style={styles.logoutButton}
        >
          <Text
            style={[
              styles.logoutText,
              { color: colors.error },
            ]}
          >
            LOG OUT OF SANCTUARY
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom spacing for tab bar */}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 60,
  },

  /* ── Hero / Appearance ─────────────────────────────────────────── */

  heroSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: 'Newsreader_400Regular_Italic',
    fontSize: 38,
    lineHeight: 44,
  },

  /* ── Theme Grid ────────────────────────────────────────────────── */

  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  themeCard: {
    width: '48%',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    position: 'relative',
  },
  checkmarkBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    lineHeight: 16,
  },
  swatchRow: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 8,
  },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  themeCardName: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    marginBottom: 4,
  },
  themeCardSubtitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
  },

  /* ── Section Headers ───────────────────────────────────────────── */

  sectionHeader: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 40,
    marginBottom: 20,
  },

  /* ── Settings Rows ─────────────────────────────────────────────── */

  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
  },
  rowIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    marginRight: 14,
  },
  rowTextColumn: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    marginBottom: 2,
  },
  rowSubtitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
  },
  chevron: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 18,
    marginLeft: 8,
  },

  /* ── Name Editing ──────────────────────────────────────────────── */

  nameEditContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Manrope_400Regular',
  },
  saveButton: {
    marginLeft: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveButtonText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },

  /* ── Toggle ────────────────────────────────────────────────────── */

  toggleTrack: {
    width: 48,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },

  /* ── Stats Grid ────────────────────────────────────────────────── */

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  statValue: {
    fontFamily: 'Newsreader_700Bold_Italic',
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* ── Support Banner ────────────────────────────────────────────── */

  supportBanner: {
    borderRadius: 16,
    padding: 28,
    marginTop: 40,
    overflow: 'hidden',
    position: 'relative',
  },
  supportBannerDecor: {
    position: 'absolute',
    right: -10,
    bottom: -20,
    fontSize: 140,
    opacity: 0.06,
    fontFamily: 'Newsreader_700Bold_Italic',
    lineHeight: 150,
  },
  supportBannerHeadline: {
    fontFamily: 'Newsreader_400Regular_Italic',
    fontSize: 24,
    marginBottom: 10,
  },
  supportBannerBody: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.9,
    marginBottom: 20,
  },
  supportBannerButton: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  supportBannerButtonText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },

  /* ── About ─────────────────────────────────────────────────────── */

  aboutSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  aboutAppName: {
    fontFamily: 'Newsreader_600SemiBold_Italic',
    fontSize: 16,
    marginBottom: 4,
  },
  aboutVersion: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
  },

  /* ── Logout ────────────────────────────────────────────────────── */

  logoutContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  logoutButton: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  logoutText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
