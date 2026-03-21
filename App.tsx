import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { TasksProvider } from './src/context/TasksContext';
import { SchedulerProvider } from './src/context/SchedulerContext';
import { SettingsProvider } from './src/context/SettingsContext';
import TodayScreen from './src/screens/TodayScreen';
import AllTasksScreen from './src/screens/AllTasksScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import MoodScreen from './src/screens/MoodScreen';
import SchedulerScreen from './src/screens/SchedulerScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AddTaskScreen from './src/screens/AddTaskScreen';
import EditTaskScreen from './src/screens/EditTaskScreen';
import TemplateEditorScreen from './src/screens/TemplateEditorScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabIcon({ label }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Today: '☀️',
    Tasks: '✅',
    Calendar: '📅',
    Mood: '😊',
    Scheduler: '🗓️',
    Settings: '⚙️',
  };
  return <Text style={{ fontSize: 20 }}>{icons[label] ?? '•'}</Text>;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: '#1a237e' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e8eaf6' },
        tabBarActiveTintColor: '#1a237e',
        tabBarInactiveTintColor: '#9e9e9e',
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Tasks" component={AllTasksScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Mood" component={MoodScreen} />
      <Tab.Screen name="Scheduler" component={SchedulerScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <TasksProvider>
          <SchedulerProvider>
            <NavigationContainer>
              <StatusBar style="light" />
              <Stack.Navigator
                screenOptions={{
                  headerStyle: { backgroundColor: '#1a237e' },
                  headerTintColor: '#fff',
                  headerTitleStyle: { fontWeight: '700' },
                }}
              >
                <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
                <Stack.Screen name="AddTask" component={AddTaskScreen} options={{ title: 'New Task' }} />
                <Stack.Screen name="EditTask" component={EditTaskScreen} options={{ title: 'Edit Task' }} />
                <Stack.Screen name="TemplateEditor" component={TemplateEditorScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </SchedulerProvider>
        </TasksProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}
