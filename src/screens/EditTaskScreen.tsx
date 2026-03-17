import React from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTasks } from '../context/TasksContext';
import { updateTask } from '../storage/tasks';
import { Task } from '../types';
import TaskForm from '../components/TaskForm';

type EditTaskRouteParams = { task: Task };

export default function EditTaskScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, EditTaskRouteParams>, string>>();
  const { setTasks } = useTasks();

  const existingTask = route.params.task;

  const handleSave = async (task: Task) => {
    const updated = await updateTask(task);
    setTasks(updated);
    navigation.goBack();
  };

  return (
    <TaskForm
      existingTask={existingTask}
      onSave={handleSave}
      submitLabel="Save Changes"
    />
  );
}
