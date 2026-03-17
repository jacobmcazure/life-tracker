import React, { useState } from 'react';
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
import { todayKey, getDayCompletionRate } from '../utils/dates';
import { Task } from '../types';
import { updateTask, deleteTask } from '../storage/tasks';
import { useNavigation } from '@react-navigation/native';

const PRIORITY_COLOR: Record<string, string> = {
  high: '#e74c3c',
  medium: '#f39c12',
  low: '#27ae60',
};

export default function TodayScreen() {
  const { tasks, setTasks, reloadTasks } = useTasks();
  const navigation = useNavigation<any>();
  const today = todayKey();

  const activeTasks = tasks
    .filter((t) => t.frequency !== 'longterm')
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });

  const completionRate = getDayCompletionRate(tasks, today);

  const toggleTask = async (task: Task) => {
    const updated: Task = {
      ...task,
      completions: {
        ...task.completions,
        [today]: !task.completions[today],
      },
    };
    const next = await updateTask(updated);
    setTasks(next);
  };

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

  const renderTask = ({ item }: { item: Task }) => {
    const done = !!item.completions[today];
    return (
      <TouchableOpacity
        style={[styles.taskCard, done && styles.taskDone]}
        onPress={() => toggleTask(item)}
        onLongPress={() => confirmDelete(item)}
      >
        <View style={[styles.priorityBar, { backgroundColor: PRIORITY_COLOR[item.priority] }]} />
        <View style={styles.taskContent}>
          <Text style={[styles.taskTitle, done && styles.taskTitleDone]}>{item.title}</Text>
          <Text style={styles.taskMeta}>
            {item.frequency.toUpperCase()}
            {item.unit ? `  •  ${item.dailyGoalAmount} ${item.unit}/day` : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('EditTask', { task: item })}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.editText}>✎</Text>
        </TouchableOpacity>
        <View style={[styles.checkBox, done && styles.checkBoxDone]}>
          {done && <Text style={styles.checkMark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today</Text>
        <Text style={styles.headerDate}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${completionRate}%` }]} />
        </View>
        <Text style={styles.progressText}>{completionRate}% complete</Text>
      </View>

      <FlatList
        data={activeTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No tasks yet. Tap + to add one.</Text>
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
  header: {
    backgroundColor: '#1a237e',
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '700' },
  headerDate: { color: '#9fa8da', fontSize: 14, marginTop: 2, marginBottom: 12 },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#64ffda', borderRadius: 3 },
  progressText: { color: '#e8eaf6', fontSize: 12, marginTop: 6 },
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
  taskDone: { opacity: 0.6 },
  priorityBar: { width: 5 },
  taskContent: { flex: 1, padding: 14 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#1a237e' },
  taskTitleDone: { textDecorationLine: 'line-through', color: '#888' },
  taskMeta: { fontSize: 12, color: '#888', marginTop: 4 },
  checkBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#c5cae9',
    margin: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxDone: { backgroundColor: '#1a237e', borderColor: '#1a237e' },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  editBtn: { justifyContent: 'center', paddingHorizontal: 6 },
  editText: { color: '#9fa8da', fontSize: 18 },
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
