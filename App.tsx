import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { MoodProvider } from './src/context/MoodContext';
import { SchedulerProvider } from './src/context/SchedulerContext';
import { SettingsProvider, useTheme } from './src/context/SettingsContext';
import DashboardScreen from './src/screens/DashboardScreen';
import JournalScreen from './src/screens/JournalScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import SchedulerScreen from './src/screens/SchedulerScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TemplateEditorScreen from './src/screens/TemplateEditorScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabIcon({ label }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Dashboard: '🏠',
    Journal: '📓',
    Calendar: '📅',
    Scheduler: '🗓️',
    Settings: '⚙️',
  };
  return <Text style={{ fontSize: 20 }}>{icons[label] ?? '•'}</Text>;
}

function MainTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: colors.headerText,
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Journal" component={JournalScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Scheduler" component={SchedulerScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { colors } = useTheme();
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.headerBg },
          headerTintColor: colors.headerText,
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="TemplateEditor" component={TemplateEditorScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <MoodProvider>
          <SchedulerProvider>
            <AppNavigator />
          </SchedulerProvider>
        </MoodProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}
