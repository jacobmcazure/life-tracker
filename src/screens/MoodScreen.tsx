import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useTasks } from '../context/TasksContext';
import { todayKey } from '../utils/dates';
import { MoodLevel } from '../types';
import { format, parseISO } from 'date-fns';

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

export default function MoodScreen() {
  const { moodEntries, upsertMood } = useTasks();
  const today = todayKey();

  const todayEntry = moodEntries.find((e) => e.date === today);
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(
    (todayEntry?.mood as MoodLevel) ?? null
  );
  const [note, setNote] = useState(todayEntry?.note ?? '');
  const [saved, setSaved] = useState(!!todayEntry);

  const handleSave = async () => {
    if (!selectedMood) return;
    await upsertMood({ date: today, mood: selectedMood, note: note.trim() || undefined });
    setSaved(true);
  };

  const recentEntries = [...moodEntries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>How did today go?</Text>
        <Text style={styles.sectionDate}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>

        <View style={styles.moodRow}>
          {([1, 2, 3, 4, 5] as MoodLevel[]).map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.moodBtn,
                selectedMood === level && { backgroundColor: MOOD_COLORS[level] },
              ]}
              onPress={() => { setSelectedMood(level); setSaved(false); }}
            >
              <Text style={styles.moodEmoji}>{MOOD_EMOJI[level]}</Text>
              <Text style={[styles.moodLabel, selectedMood === level && styles.moodLabelActive]}>
                {MOOD_LABELS[level]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="How did things go? Anything notable?"
          placeholderTextColor="#aaa"
          multiline
          value={note}
          onChangeText={(t) => { setNote(t); setSaved(false); }}
        />

        <TouchableOpacity
          style={[styles.saveBtn, !selectedMood && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!selectedMood}
        >
          <Text style={styles.saveBtnText}>{saved ? '✓ Saved' : 'Save Mood'}</Text>
        </TouchableOpacity>

        {recentEntries.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Recent</Text>
            {recentEntries.map((entry) => (
              <View key={entry.date} style={styles.historyRow}>
                <View
                  style={[styles.moodDot, { backgroundColor: MOOD_COLORS[entry.mood as MoodLevel] }]}
                />
                <View style={styles.historyContent}>
                  <Text style={styles.historyDate}>
                    {format(parseISO(entry.date), 'EEE, MMM d')}
                  </Text>
                  <Text style={styles.historyMood}>{MOOD_EMOJI[entry.mood as MoodLevel]} {MOOD_LABELS[entry.mood as MoodLevel]}</Text>
                  {entry.note && <Text style={styles.historyNote}>{entry.note}</Text>}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  scroll: { padding: 20, paddingBottom: 60 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1a237e' },
  sectionDate: { fontSize: 13, color: '#888', marginBottom: 20, marginTop: 4 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginHorizontal: 3,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#dde3f0',
  },
  moodEmoji: { fontSize: 24 },
  moodLabel: { fontSize: 10, color: '#888', marginTop: 4, fontWeight: '500' },
  moodLabelActive: { color: '#fff' },
  label: { fontSize: 13, fontWeight: '700', color: '#1a237e', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  noteInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#222',
    borderWidth: 1,
    borderColor: '#dde3f0',
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 4,
  },
  saveBtn: {
    backgroundColor: '#1a237e',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnDisabled: { backgroundColor: '#c5cae9' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  moodDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, marginRight: 12 },
  historyContent: { flex: 1 },
  historyDate: { fontSize: 12, color: '#888', marginBottom: 2 },
  historyMood: { fontSize: 14, fontWeight: '600', color: '#333' },
  historyNote: { fontSize: 13, color: '#666', marginTop: 4 },
});
