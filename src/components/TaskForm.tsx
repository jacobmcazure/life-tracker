import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Task, TaskFrequency, TaskPriority } from '../types';

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const FREQUENCIES: { label: string; value: TaskFrequency }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Long-term', value: 'longterm' },
];

const PRIORITIES: { label: string; value: TaskPriority; color: string }[] = [
  { label: 'High', value: 'high', color: '#e74c3c' },
  { label: 'Medium', value: 'medium', color: '#f39c12' },
  { label: 'Low', value: 'low', color: '#27ae60' },
];

interface Props {
  /** Pass an existing task to pre-fill the form for editing. Omit for new task. */
  existingTask?: Task;
  onSave: (task: Task) => Promise<void>;
  submitLabel?: string;
}

export default function TaskForm({ existingTask, onSave, submitLabel = 'Add Task' }: Props) {
  const [title, setTitle] = useState(existingTask?.title ?? '');
  const [frequency, setFrequency] = useState<TaskFrequency>(existingTask?.frequency ?? 'daily');
  const [priority, setPriority] = useState<TaskPriority>(existingTask?.priority ?? 'medium');
  const [totalAmount, setTotalAmount] = useState(existingTask?.totalAmount?.toString() ?? '');
  const [dailyGoalAmount, setDailyGoalAmount] = useState(existingTask?.dailyGoalAmount?.toString() ?? '');
  const [unit, setUnit] = useState(existingTask?.unit ?? '');
  const [notes, setNotes] = useState(existingTask?.notes ?? '');

  const hasGoal = frequency !== 'longterm';

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a task title.');
      return;
    }

    if (dailyGoalAmount && !unit.trim()) {
      Alert.alert('Unit required', 'Please add a unit for your daily goal (e.g. minutes, pages).');
      return;
    }

    const task: Task = {
      // Preserve existing fields (id, createdAt, completions) when editing
      id: existingTask?.id ?? uid(),
      createdAt: existingTask?.createdAt ?? new Date().toISOString(),
      completions: existingTask?.completions ?? {},
      // Updated fields
      title: title.trim(),
      frequency,
      priority,
      notes: notes.trim() || undefined,
      longtermStatus: frequency === 'longterm'
        ? (existingTask?.longtermStatus ?? 'not_started')
        : undefined,
      totalAmount: totalAmount ? parseFloat(totalAmount) : undefined,
      dailyGoalAmount: dailyGoalAmount ? parseFloat(dailyGoalAmount) : undefined,
      unit: unit.trim() || undefined,
    };

    await onSave(task);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Task Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Read 10 pages"
          placeholderTextColor="#aaa"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Frequency</Text>
        <View style={styles.row}>
          {FREQUENCIES.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[styles.chip, frequency === f.value && styles.chipActive]}
              onPress={() => setFrequency(f.value)}
            >
              <Text style={[styles.chipText, frequency === f.value && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Priority</Text>
        <View style={styles.row}>
          {PRIORITIES.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[
                styles.chip,
                priority === p.value && { backgroundColor: p.color, borderColor: p.color },
              ]}
              onPress={() => setPriority(p.value)}
            >
              <Text style={[styles.chipText, priority === p.value && styles.chipTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {hasGoal && (
          <>
            <Text style={styles.label}>Daily Goal (optional)</Text>
            <Text style={styles.sublabel}>
              e.g. 20 minutes, 10 pages. A unit is required if you set a goal.
            </Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="Amount (e.g. 20)"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                value={dailyGoalAmount}
                onChangeText={setDailyGoalAmount}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Unit (e.g. minutes)"
                placeholderTextColor="#aaa"
                value={unit}
                onChangeText={setUnit}
              />
            </View>

            <Text style={styles.label}>Total Target (optional)</Text>
            <Text style={styles.sublabel}>
              Set a finish line to auto-calculate an estimated completion date.
            </Text>
            <TextInput
              style={styles.input}
              placeholder={unit ? `Total ${unit} (e.g. 300)` : 'Total amount (e.g. 300)'}
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              value={totalAmount}
              onChangeText={setTotalAmount}
            />
          </>
        )}

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Any extra details..."
          placeholderTextColor="#aaa"
          multiline
          value={notes}
          onChangeText={setNotes}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{submitLabel}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  scroll: { padding: 20, paddingBottom: 60 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a237e',
    marginTop: 16,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sublabel: { fontSize: 12, color: '#888', marginBottom: 8, marginTop: -4 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#222',
    borderWidth: 1,
    borderColor: '#dde3f0',
    marginBottom: 4,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#c5cae9',
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#1a237e', borderColor: '#1a237e' },
  chipText: { color: '#555', fontSize: 14, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  saveBtn: {
    backgroundColor: '#1a237e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
