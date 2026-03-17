import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTasks } from '../context/TasksContext';
import { addTask } from '../storage/tasks';
import { Task } from '../types';
import TaskForm from '../components/TaskForm';

export default function AddTaskScreen() {
  const navigation = useNavigation();
  const { setTasks } = useTasks();

  const handleSave = async (task: Task) => {
    const updated = await addTask(task);
    setTasks(updated);
    navigation.goBack();
  };

  return <TaskForm onSave={handleSave} submitLabel="Add Task" />;
}
