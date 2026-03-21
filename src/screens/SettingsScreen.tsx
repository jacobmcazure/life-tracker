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
import { useSettings } from '../context/SettingsContext';
import { useTasks } from '../context/TasksContext';
import { todayKey } from '../utils/dates';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Compute the current daily-completion streak ending today (or yesterday). */
function computeStreak(
  completions: Array<Record<string, boolean>>,
  activeTasks: number,
): number {
  if (activeTasks === 0) return 0;

  let streak = 0;
  const today = new Date();

  for (let offset = 0; offset < 365; offset++) {
    const d = subDays(today, offset);
    const key = format(d, 'yyyy-MM-dd');

    const doneCount = completions.filter((c) => c[key]).length;
    // Count the day if the user completed all active tasks that day
    if (doneCount >= activeTasks) {
      streak++;
    } else if (offset === 0) {
      // Today isn't complete yet -- that's okay, keep checking yesterday
      continue;
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
  const { tasks, moodEntries } = useTasks();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(settings.displayName);

  const isDark = settings.theme === 'dark';

  // --- derived stats ---
  const activeTasks = useMemo(
    () => tasks.filter((t) => t.frequency !== 'longterm'),
    [tasks],
  );
  const longtermTasks = useMemo(
    () => tasks.filter((t) => t.frequency === 'longterm'),
    [tasks],
  );
  const completedLongterm = useMemo(
    () => longtermTasks.filter((t) => t.longtermStatus === 'completed').length,
    [longtermTasks],
  );

  const streak = useMemo(
    () => computeStreak(activeTasks.map((t) => t.completions), activeTasks.length),
    [activeTasks],
  );

  const today = todayKey();
  const todayDone = activeTasks.filter((t) => t.completions[today]).length;

  const totalCompletions = useMemo(
    () =>
      tasks.reduce(
        (sum, t) => sum + Object.values(t.completions).filter(Boolean).length,
        0,
      ),
    [tasks],
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
    updateSettings({ theme: isDark ? 'light' : 'dark' });
  };

  const confirmClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all tasks, mood entries, schedules, and settings. This cannot be undone.',
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

  // --- theming ---
  const colors = isDark
    ? {
        bg: '#121212',
        card: '#1e1e1e',
        text: '#e0e0e0',
        muted: '#888',
        primary: '#7986cb',
        headerBg: '#1a237e',
        border: '#333',
        inputBg: '#2a2a2a',
        dangerBg: '#3e1a1a',
        dangerText: '#ef5350',
      }
    : {
        bg: '#f0f4f8',
        card: '#fff',
        text: '#1a237e',
        muted: '#888',
        primary: '#1a237e',
        headerBg: '#1a237e',
        border: '#e8eaf6',
        inputBg: '#f5f5f5',
        dangerBg: '#fdecea',
        dangerText: '#c62828',
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
            <TouchableOpacity style={styles.saveBtn} onPress={saveName}>
              <Text style={styles.saveBtnText}>Save</Text>
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
                {isDark ? 'Dark' : 'Light'}
              </Text>
              <View style={[styles.toggleTrack, isDark && styles.toggleTrackActive]}>
                <View style={[styles.toggleThumb, isDark && styles.toggleThumbActive]} />
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
          value={`${todayDone}/${activeTasks.length} tasks`}
        />
        <Row label="Total Completions" value={`${totalCompletions}`} />
        <Row label="Active Tasks" value={`${activeTasks.length}`} />
        <Row
          label="Long-term Goals"
          value={`${completedLongterm}/${longtermTasks.length} completed`}
        />
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
    backgroundColor: '#1a237e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // theme toggle
  themeToggle: { flexDirection: 'row', alignItems: 'center' },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#c5cae9',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleTrackActive: { backgroundColor: '#7986cb' },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  toggleThumbActive: { alignSelf: 'flex-end' },
});
