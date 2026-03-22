import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_600SemiBold_Italic,
  Newsreader_700Bold_Italic,
} from '@expo-google-fonts/newsreader';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';

import { MoodProvider } from './src/context/MoodContext';
import { SchedulerProvider } from './src/context/SchedulerContext';
import { SettingsProvider, useTheme } from './src/context/SettingsContext';
import DashboardScreen from './src/screens/DashboardScreen';
import JournalScreen from './src/screens/JournalScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import SchedulerScreen from './src/screens/SchedulerScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TemplateEditorScreen from './src/screens/TemplateEditorScreen';
import BottomTabBar from './src/components/BottomTabBar';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
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
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface, elevation: 0, shadowOpacity: 0 },
          headerTintColor: colors.primary,
          headerTitleStyle: { fontFamily: 'Newsreader_600SemiBold_Italic', fontSize: 22, fontWeight: undefined },
        }}
      >
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="TemplateEditor" component={TemplateEditorScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_600SemiBold_Italic,
    Newsreader_700Bold_Italic,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
