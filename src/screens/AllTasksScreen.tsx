import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useTasks } from '../context/TasksContext';
import { deleteTask, updateTask } from '../storage/tasks';
import { calcCompletionDate } from '../utils/dates';
import { Task, LongtermStatus } from '../types';
import { useNavigation } from '@react-navigation/native';

const PRIORITY_COLOR: Record<string, string> = {
  high: '#e74c3c',
  medium: '#f39c12',
  low: '#27ae60',
};

const STATUS_LABEL: Record<LongtermStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  paused: 'Paused',
};

const STATUS_COLOR: Record<LongtermStatus, string> = {
  not_started: '#aaa',
  in_progress: '#1a73e8',
  completed: '#27ae60',
  paused: '#f39c12',
};

const LONGTERM_STATUSES: LongtermStatus[] = ['not_started', 'in_progress', 'completed', 'paused'];

export default function AllTasksScreen() {
  const { tasks, setTasks } = useTasks();
  const navigation = useNavigation<any>();

  const sorted = [...tasks].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  const confirmDelete = (task: Task) => {
    Alert.alert('Delete Task', `Delete "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const next = await deleteTask(task.id);
          setTasks(next);
        },
      },
    ]);
  };

  const cycleStatus = async (task: Task) => {
    if (task.frequency !== 'longterm') return;
    const idx = LONGTERM_STATUSES.indexOf(task.longtermStatus ?? 'not_started');
    const next = LONGTERM_STATUSES[(idx + 1) % LONGTERM_STATUSES.length];
    const updated = { ...task, longtermStatus: next };
    const all = await updateTask(updated);
    setTasks(all);
  };

  const renderTask = ({ item }: { item: Task }) => {
    const completionDate = calcCompletionDate(item);
    const status = item.longtermStatus;

    return (
      <View style={styles.taskCard}>
        <View style={[styles.priorityBar, { backgroundColor: PRIORITY_COLOR[item.priority] }]} />
        <View style={styles.taskContent}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <Text style={styles.taskMeta}>
            {item.frequency.toUpperCase()}
            {item.unit
              ? `  •  ${item.dailyGoalAmount} ${item.unit}/day  •  ${item.totalAmount} ${item.unit} total`
              : ''}
          </Text>
          {completionDate && (
            <Text style={styles.completionDate}>
              {completionDate === 'Done' ? '✓ Completed!' : `Est. done: ${completionDate}`}
            </Text>
          )}
          {status && (
            <TouchableOpacity onPress={() => cycleStatus(item)}>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[status] }]}>
                <Text style={styles.statusText}>{STATUS_LABEL[status]}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('EditTask', { task: item })}
          >
            <Text style={styles.editText}>✎</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => confirmDelete(item)}>
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No tasks yet. Add one from the Today tab.</Text>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTask')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  list: { padding: 16, paddingBottom: 100 },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  priorityBar: { width: 5 },
  taskContent: { flex: 1, padding: 14 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#1a237e' },
  taskMeta: { fontSize: 12, color: '#888', marginTop: 4 },
  completionDate: { fontSize: 12, color: '#27ae60', marginTop: 4, fontWeight: '500' },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 6,
  },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  actions: { flexDirection: 'column', justifyContent: 'center' },
  actionBtn: { padding: 12, alignItems: 'center', justifyContent: 'center' },
  editText: { color: '#9fa8da', fontSize: 18 },
  deleteText: { color: '#ccc', fontSize: 16 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 60, fontSize: 15 },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    backgroundColor: '#1a237e',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
