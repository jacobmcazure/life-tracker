import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { format, parseISO } from 'date-fns';
import { useScheduler } from '../context/SchedulerContext';
import { useMood } from '../context/MoodContext';
import { useTheme } from '../context/SettingsContext';
import { resolveTemplate } from '../storage/scheduler';
import { todayKey, formatTime } from '../utils/dates';
import { MoodLevel } from '../types';
import ScreenHeader from '../components/ScreenHeader';
import { typography, layout, TAB_BAR_BOTTOM_INSET } from '../styles/shared';

// ── Constants ────────────────────────────────────────────────────────────────

const MOOD_EMOJI: Record<MoodLevel, string> = {
  1: '😢',
  2: '😕',
  3: '😐',
  4: '😊',
  5: '😄',
};

const MOOD_BUTTON_STYLES: Record<MoodLevel, { bg: string; text: string }> = {
  5: { bg: '#dee0ff', text: '#575d84' },
  4: { bg: '#b1f0ce', text: '#0f5238' },
  3: { bg: '#ffdbd2', text: '#9a442d' },
  2: { bg: '#bec4f1', text: '#3f456b' },
  1: { bg: '#fc9174', text: '#742814' },
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

  // ── Section: Completed Today ─────────────────────────────────────────────

  const todayTemplate = resolveTemplate(assignments, templates, today);
  const dayCompletions = blockCompletions[today] ?? {};

  const completedBlocks = todayTemplate
    ? todayTemplate.blocks
        .filter((b) => b.tracked && dayCompletions[b.id])
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
    : [];

  // ── Section: Mood ────────────────────────────────────────────────────────

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

  // ── Section: Day Notes ───────────────────────────────────────────────────

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
    <View style={styles.root}>
      <ScreenHeader />
      <ScrollView
        style={{ backgroundColor: colors.surface }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero Section ── */}
        <View style={styles.hero}>
          <Text style={[styles.eyebrow, { color: colors.secondary }]}>
            DAILY CHECK-IN
          </Text>
          <Text style={[styles.heroTitle, { color: colors.primary }]}>
            Journal
          </Text>
        </View>

        {/* ── Mood Selector Card ── */}
        <View
          style={[
            styles.moodCard,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <Text style={[styles.moodPrompt, { color: colors.onSurfaceVariant }]}>
            How are you feeling right now?
          </Text>

          <View style={styles.moodRow}>
            {([1, 2, 3, 4, 5] as MoodLevel[]).map((level) => {
              const isSelected = selectedMood === level;
              const btnStyle = MOOD_BUTTON_STYLES[level];
              return (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.moodBtn,
                    { backgroundColor: btnStyle.bg },
                    isSelected && {
                      borderWidth: 3,
                      borderColor: btnStyle.text,
                    },
                  ]}
                  onPress={() => {
                    moodUserEdited.current = true;
                    setSelectedMood(level);
                    setMoodSaved(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.moodEmoji}>{MOOD_EMOJI[level]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedMood !== null && (
            <>
              <TextInput
                style={[
                  styles.moodNoteInput,
                  {
                    backgroundColor: colors.surfaceContainerLowest,
                    color: colors.onSurface,
                  },
                ]}
                placeholder="Add a note..."
                placeholderTextColor={colors.outline}
                multiline
                value={moodNote}
                onChangeText={(t) => {
                  moodUserEdited.current = true;
                  setMoodNote(t);
                  setMoodSaved(false);
                }}
              />
              <TouchableOpacity
                style={[
                  styles.moodSaveBtn,
                  { backgroundColor: colors.primary },
                  moodSaved && { opacity: 0.5 },
                ]}
                onPress={handleMoodSave}
                disabled={moodSaved}
                activeOpacity={0.7}
              >
                <Text style={[styles.moodSaveBtnText, { color: colors.onPrimary }]}>
                  {moodSaved ? 'Saved' : 'Save Mood'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ── Today's Moments ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.outline }]}>
            TODAY'S MOMENTS
          </Text>
          <View style={styles.grid}>
            {completedBlocks.map((block) => (
              <View
                key={block.id}
                style={[
                  styles.momentCard,
                  {
                    backgroundColor: colors.surfaceContainerLowest,
                    borderLeftColor: colors.primary,
                  },
                ]}
              >
                <Text style={[styles.momentActivity, { color: colors.onSurface }]}>
                  {block.activity}
                </Text>
                <Text style={[styles.momentSubtitle, { color: colors.primary }]}>
                  Completed
                </Text>
              </View>
            ))}
            <View
              style={[
                styles.badgeCard,
                { backgroundColor: colors.surfaceContainerLowest },
              ]}
            >
              <Text style={[styles.momentActivity, { color: colors.onSurface }]}>
                Achievement
              </Text>
              <Text
                style={[
                  styles.momentSubtitle,
                  { color: colors.onSurfaceVariant, fontStyle: 'italic' },
                ]}
              >
                Keep going!
              </Text>
            </View>
            {completedBlocks.length === 0 && (
              <Text
                style={[
                  styles.emptyMoments,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                No moments captured yet today
              </Text>
            )}
          </View>
        </View>

        {/* ── Evening Reflection ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.outline }]}>
            EVENING REFLECTION
          </Text>
          <View style={styles.reflectionContainer}>
            <TextInput
              style={[
                styles.reflectionInput,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  color: colors.onSurface,
                },
              ]}
              placeholder="How did your day feel?"
              placeholderTextColor={colors.outline}
              multiline
              value={noteText}
              onChangeText={handleNoteChange}
              onBlur={handleNoteBlur}
              textAlignVertical="top"
            />
            {noteSaveStatus === 'saved' && (
              <Text
                style={[
                  styles.reflectionSaved,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                Saved
              </Text>
            )}
          </View>
        </View>

        {/* ── Achievements ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.outline }]}>
            ACHIEVEMENTS
          </Text>
          <View style={styles.achievementsGrid}>
            <View
              style={[
                styles.achievementCard,
                { backgroundColor: colors.tertiaryFixed },
              ]}
            >
              <Text style={styles.achievementEmoji}>🌿</Text>
              <Text style={[styles.achievementTitle, { color: colors.tertiary }]}>
                Rooted Spirit
              </Text>
              <Text
                style={[
                  styles.achievementSubtitle,
                  { color: colors.tertiary + 'B3' },
                ]}
              >
                7 DAY STREAK
              </Text>
            </View>
            <View
              style={[styles.achievementCard, { backgroundColor: colors.onPrimaryContainer }]}
            >
              <Text style={styles.achievementEmoji}>✨</Text>
              <Text style={[styles.achievementTitle, { color: colors.primary }]}>
                Quiet Mind
              </Text>
              <Text
                style={[
                  styles.achievementSubtitle,
                  { color: colors.primary + 'B3' },
                ]}
              >
                50 DEEP BREATHS
              </Text>
            </View>
          </View>
        </View>

        {/* ── Recent Mood History ── */}
        {recentMoodEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.outline }]}>
              RECENT MOODS
            </Text>
            {recentMoodEntries.map((entry) => {
              const moodStyle =
                MOOD_BUTTON_STYLES[entry.mood as MoodLevel] ?? MOOD_BUTTON_STYLES[3];
              return (
                <View
                  key={entry.date}
                  style={[
                    styles.moodHistoryRow,
                    { backgroundColor: colors.surfaceContainerLow + '66' },
                  ]}
                >
                  <View
                    style={[
                      styles.moodDot,
                      { backgroundColor: moodStyle.bg },
                    ]}
                  />
                  <View style={styles.moodHistoryMid}>
                    <Text
                      style={[
                        styles.moodHistoryDate,
                        { color: colors.onSurfaceVariant },
                      ]}
                    >
                      {format(parseISO(entry.date), 'MMM d')}
                    </Text>
                    {entry.note ? (
                      <Text
                        style={[
                          styles.moodHistoryNote,
                          { color: colors.onSurfaceVariant },
                        ]}
                        numberOfLines={1}
                      >
                        {entry.note}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.moodHistoryEmoji}>
                    {MOOD_EMOJI[entry.mood as MoodLevel]}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: layout.root,
  scroll: layout.scrollContent,

  // ── Hero ──
  hero: {
    marginBottom: 32,
  },
  eyebrow: typography.eyebrow,
  heroTitle: typography.heroTitle,

  // ── Mood Selector Card ──
  moodCard: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 40,
  },
  moodPrompt: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    marginBottom: 20,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 320,
  },
  moodBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodNoteInput: {
    marginTop: 16,
    borderRadius: 12,
    padding: 14,
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    minHeight: 44,
    width: '100%',
  },
  moodSaveBtn: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-end',
  },
  moodSaveBtnText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },

  // ── Sections ──
  section: {
    marginBottom: 40,
  },
  sectionLabel: typography.sectionLabel,

  // ── Today's Moments Grid ──
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  momentCard: {
    borderRadius: 16,
    padding: 20,
    width: '48%',
    borderLeftWidth: 4,
  },
  badgeCard: {
    borderRadius: 16,
    padding: 20,
    width: '48%',
  },
  momentActivity: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  momentSubtitle: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    marginTop: 4,
  },
  emptyMoments: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    paddingVertical: 8,
  },

  // ── Evening Reflection ──
  reflectionContainer: {
    position: 'relative',
  },
  reflectionInput: {
    borderRadius: 20,
    padding: 24,
    fontSize: 17,
    fontFamily: 'Newsreader_400Regular_Italic',
    minHeight: 180,
    textAlignVertical: 'top',
  },
  reflectionSaved: {
    position: 'absolute',
    bottom: 14,
    right: 18,
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
  },

  // ── Achievements ──
  achievementsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  achievementCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  achievementTitle: {
    fontFamily: 'Newsreader_600SemiBold_Italic',
    fontSize: 16,
  },
  achievementSubtitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },

  // ── Recent Mood History ──
  moodHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  moodDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  moodHistoryMid: {
    flex: 1,
  },
  moodHistoryDate: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
  moodHistoryNote: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  moodHistoryEmoji: {
    fontSize: 20,
  },
});
