import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { format, parseISO } from 'date-fns';
import { useScheduler } from '../context/SchedulerContext';
import { useMood } from '../context/MoodContext';
import { useTheme } from '../context/SettingsContext';
import { resolveTemplate } from '../storage/scheduler';
import { todayKey, formatTime } from '../utils/dates';
import { MoodLevel } from '../types';

// ── Constants ────────────────────────────────────────────────────────────────

const MOOD_LABELS: Record<MoodLevel, string> = {
  1: 'Terrible',
  2: 'Bad',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
};

const MOOD_COLORS: Record<MoodLevel, string> = {
  1: '#e53935',
  2: '#fb8c00',
  3: '#fdd835',
  4: '#7cb342',
  5: '#2e7d32',
};

const MOOD_EMOJI: Record<MoodLevel, string> = {
  1: '😞',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😄',
};

// ── Component ────────────────────────────────────────────────────────────────

export default function JournalScreen() {
  const colors = useTheme().colors;
  const {
    templates,
    assignments,
    blockCompletions,
    dayNotes,
    upsertDayNote,
  } = useScheduler();
  const { moodEntries, upsertMood } = useMood();

  const today = todayKey();

  // ── Section 1: Completed Today ───────────────────────────────────────────

  const todayTemplate = resolveTemplate(assignments, templates, today);
  const dayCompletions = blockCompletions[today] ?? {};

  const completedBlocks = todayTemplate
    ? todayTemplate.blocks
        .filter((b) => b.tracked && dayCompletions[b.id])
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
    : [];

  // ── Section 2: Mood ──────────────────────────────────────────────────────

  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [moodNote, setMoodNote] = useState('');
  const [moodSaved, setMoodSaved] = useState(false);
  const moodUserEdited = useRef(false);

  useEffect(() => {
    if (moodUserEdited.current) return;
    const todayEntry = moodEntries.find((e) => e.date === today);
    if (todayEntry) {
      setSelectedMood((todayEntry.mood as MoodLevel) ?? null);
      setMoodNote(todayEntry.note ?? '');
      setMoodSaved(true);
    }
  }, [moodEntries, today]);

  const handleMoodSave = useCallback(async () => {
    if (!selectedMood) return;
    await upsertMood({
      date: today,
      mood: selectedMood,
      note: moodNote.trim() || undefined,
    });
    setMoodSaved(true);
  }, [selectedMood, moodNote, today, upsertMood]);

  const recentMoodEntries = [...moodEntries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  // ── Section 3: Day Notes ─────────────────────────────────────────────────

  const [noteText, setNoteText] = useState('');
  const [noteSaveStatus, setNoteSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const noteUserEdited = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (noteUserEdited.current) return;
    const todayNote = dayNotes.find((n) => n.date === today);
    if (todayNote) {
      setNoteText(todayNote.text);
      setNoteSaveStatus('saved');
    }
  }, [dayNotes, today]);

  const saveNote = useCallback(
    async (text: string) => {
      setNoteSaveStatus('saving');
      await upsertDayNote(today, text);
      setNoteSaveStatus('saved');
    },
    [today, upsertDayNote],
  );

  const handleNoteChange = useCallback(
    (text: string) => {
      noteUserEdited.current = true;
      setNoteText(text);
      setNoteSaveStatus('saving');

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        saveNote(text);
      }, 1000);
    },
    [saveNote],
  );

  const handleNoteBlur = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (noteUserEdited.current) {
      saveNote(noteText);
    }
  }, [noteText, saveNote]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Section 1: Completed Today ── */}
        <Text style={[styles.sectionHeader, { color: colors.primary }]}>
          COMPLETED TODAY
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {!todayTemplate ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No schedule assigned for today.
            </Text>
          ) : completedBlocks.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No activities completed yet today.
            </Text>
          ) : (
            completedBlocks.map((block) => (
              <View
                key={block.id}
                style={[styles.completedRow, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.checkIcon, { color: colors.primary }]}>✓</Text>
                <Text style={[styles.completedTime, { color: colors.muted }]}>
                  {formatTime(block.startTime)} – {formatTime(block.endTime)}
                </Text>
                <Text
                  style={[styles.completedActivity, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {block.activity}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* ── Section 2: Mood ── */}
        <Text style={[styles.sectionHeader, { color: colors.primary, marginTop: 24 }]}>
          MOOD
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.moodRow}>
            {([1, 2, 3, 4, 5] as MoodLevel[]).map((level) => {
              const isSelected = selectedMood === level;
              return (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.moodBtn,
                    { borderColor: colors.border, backgroundColor: colors.card },
                    isSelected && { backgroundColor: MOOD_COLORS[level], borderColor: MOOD_COLORS[level] },
                  ]}
                  onPress={() => {
                    moodUserEdited.current = true;
                    setSelectedMood(level);
                    setMoodSaved(false);
                  }}
                >
                  <Text style={styles.moodEmoji}>{MOOD_EMOJI[level]}</Text>
                  <Text
                    style={[
                      styles.moodLabel,
                      { color: colors.muted },
                      isSelected && styles.moodLabelActive,
                    ]}
                  >
                    {MOOD_LABELS[level]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.inputLabel, { color: colors.primary }]}>
            MOOD NOTE
          </Text>
          <TextInput
            style={[
              styles.moodNoteInput,
              {
                backgroundColor: colors.inputBg,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="How did things go? Anything notable?"
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={3}
            value={moodNote}
            onChangeText={(t) => {
              moodUserEdited.current = true;
              setMoodNote(t);
              setMoodSaved(false);
            }}
          />

          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: colors.primary },
              !selectedMood && { opacity: 0.4 },
            ]}
            onPress={handleMoodSave}
            disabled={!selectedMood}
          >
            <Text style={[styles.saveBtnText, { color: colors.headerText }]}>
              {moodSaved ? '✓ Saved' : 'Save Mood'}
            </Text>
          </TouchableOpacity>

          {/* Recent mood history */}
          {recentMoodEntries.length > 0 && (
            <View style={styles.moodHistorySection}>
              <Text style={[styles.inputLabel, { color: colors.primary, marginTop: 16 }]}>
                RECENT
              </Text>
              {recentMoodEntries.map((entry) => (
                <View
                  key={entry.date}
                  style={[styles.moodHistoryRow, { borderBottomColor: colors.border }]}
                >
                  <View
                    style={[
                      styles.moodDot,
                      { backgroundColor: MOOD_COLORS[entry.mood as MoodLevel] },
                    ]}
                  />
                  <Text style={[styles.moodHistoryDate, { color: colors.muted }]}>
                    {format(parseISO(entry.date), 'EEE, MMM d')}
                  </Text>
                  <Text style={[styles.moodHistoryMood, { color: colors.text }]}>
                    {MOOD_EMOJI[entry.mood as MoodLevel]} {MOOD_LABELS[entry.mood as MoodLevel]}
                  </Text>
                  {entry.note ? (
                    <Text
                      style={[styles.moodHistoryNote, { color: colors.muted }]}
                      numberOfLines={1}
                    >
                      {entry.note}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Section 3: Day Notes ── */}
        <Text style={[styles.sectionHeader, { color: colors.primary, marginTop: 24 }]}>
          DAY NOTES
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.noteStatusRow}>
            <Text style={[styles.inputLabel, { color: colors.primary }]}>
              JOURNAL
            </Text>
            {noteSaveStatus !== 'idle' && (
              <Text style={[styles.noteStatusText, { color: colors.muted }]}>
                {noteSaveStatus === 'saving' ? 'Saving...' : '✓ Saved'}
              </Text>
            )}
          </View>
          <TextInput
            style={[
              styles.dayNoteInput,
              {
                backgroundColor: colors.inputBg,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Write about your day..."
            placeholderTextColor={colors.muted}
            multiline
            value={noteText}
            onChangeText={handleNoteChange}
            onBlur={handleNoteBlur}
            textAlignVertical="top"
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 60 },

  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },

  card: {
    borderRadius: 14,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
  },

  // ── Completed Today ──
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkIcon: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 10,
  },
  completedTime: {
    fontSize: 12,
    width: 130,
    fontVariant: ['tabular-nums'],
  },
  completedActivity: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  // ── Mood ──
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginHorizontal: 3,
    borderWidth: 1.5,
  },
  moodEmoji: { fontSize: 24 },
  moodLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  moodLabelActive: { color: '#fff' },

  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  moodNoteInput: {
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    height: 80,
    textAlignVertical: 'top',
  },

  saveBtn: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },

  moodHistorySection: {},
  moodHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexWrap: 'wrap',
  },
  moodDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  moodHistoryDate: {
    fontSize: 12,
    width: 80,
  },
  moodHistoryMood: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  moodHistoryNote: {
    fontSize: 12,
    width: '100%',
    marginTop: 2,
    marginLeft: 18,
  },

  // ── Day Notes ──
  noteStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  noteStatusText: {
    fontSize: 12,
  },
  dayNoteInput: {
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    minHeight: 160,
    textAlignVertical: 'top',
  },
});
