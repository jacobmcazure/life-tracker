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
    const dayData = blockCompletions[key] ?? {};
    const allDone = template.blocks.every((b) => dayData[b.id]);
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
  const todayBlocks = todayTemplate ? todayTemplate.blocks.length : 0;
  const todayDone = useMemo(() => {
    if (!todayTemplate) return 0;
    const dayData = blockCompletions[today] ?? {};
    return todayTemplate.blocks.filter((b) => dayData[b.id]).length;
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

  const toggleTheme = () => {
    const currentIdx = BUILT_IN_THEMES.findIndex((t) => t.id === settings.activeThemeId);
    const nextIdx = (currentIdx + 1) % BUILT_IN_THEMES.length;
    updateSettings({ activeThemeId: BUILT_IN_THEMES[nextIdx].id });
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
  /*  Render helpers                                                   */
  /* ---------------------------------------------------------------- */

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={[styles.sectionHeader, { color: colors.primary }]}>{title}</Text>
  );

  const Row = ({
    label,
    value,
    onPress,
  }: {
    label: string;
    value: string;
    onPress?: () => void;
  }) => {
    const inner = (
      <View style={[styles.row, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: colors.muted }]}>{value}</Text>
      </View>
    );
    if (onPress) {
      return <TouchableOpacity onPress={onPress}>{inner}</TouchableOpacity>;
    }
    return inner;
  };

  /* ---------------------------------------------------------------- */
  /*  Main render                                                      */
  /* ---------------------------------------------------------------- */

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* ---- Profile section ---- */}
      <SectionHeader title="PROFILE" />
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {editingName ? (
          <View style={styles.nameEditRow}>
            <TextInput
              style={[
                styles.nameInput,
                { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border },
              ]}
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Enter your name"
              placeholderTextColor={colors.muted}
              autoFocus
              onSubmitEditing={saveName}
              returnKeyType="done"
            />
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={saveName}>
              <Text style={[styles.saveBtnText, { color: colors.headerText }]}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Row
            label="Display Name"
            value={settings.displayName || 'Tap to set'}
            onPress={() => {
              setNameDraft(settings.displayName);
              setEditingName(true);
            }}
          />
        )}
        <Row label="Date Joined" value={dateJoinedDisplay} />
        <Row label="Member For" value={`${memberDays} day${memberDays !== 1 ? 's' : ''}`} />
      </View>

      {/* ---- Appearance section ---- */}
      <SectionHeader title="APPEARANCE" />
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={toggleTheme}>
          <View style={[styles.row, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Theme</Text>
            <View style={styles.themeToggle}>
              <Text style={[styles.rowValue, { color: colors.muted, marginRight: 8 }]}>
                {theme.name}
              </Text>
              <View style={[styles.toggleTrack, { backgroundColor: colors.border }, settings.activeThemeId !== 'light' && { backgroundColor: colors.primary }]}>
                <View style={[styles.toggleThumb, settings.activeThemeId !== 'light' && styles.toggleThumbActive]} />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* ---- Stats section ---- */}
      <SectionHeader title="STATS" />
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Row label="Current Streak" value={`${streak} day${streak !== 1 ? 's' : ''}`} />
        <Row
          label="Today's Progress"
          value={`${todayDone}/${todayBlocks} blocks`}
        />
        <Row label="Total Completions" value={`${totalCompletions}`} />
        <Row label="Schedule Templates" value={`${templates.length}`} />
        <Row label="Mood Entries" value={`${moodEntries.length}`} />
      </View>

      {/* ---- About section ---- */}
      <SectionHeader title="ABOUT" />
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Row label="App Name" value="Life Tracker" />
        <Row label="Version" value="1.0.0" />
        <Row label="Platform" value="Expo / React Native" />
      </View>

      {/* ---- Danger zone ---- */}
      <SectionHeader title="DATA" />
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={confirmClearData}>
          <View
            style={[
              styles.row,
              {
                backgroundColor: colors.dangerBg,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.rowLabel, { color: colors.dangerText }]}>
              Clear All Data
            </Text>
            <Text style={{ color: colors.dangerText, fontSize: 16 }}>{'>'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 24,
    marginBottom: 6,
    marginHorizontal: 16,
  },
  card: {
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowValue: { fontSize: 15 },

  // name editing
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  saveBtn: {
    marginLeft: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveBtnText: { fontWeight: '600', fontSize: 14 },

  // theme toggle
  themeToggle: { flexDirection: 'row', alignItems: 'center' },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  toggleThumbActive: { alignSelf: 'flex-end' },
});
