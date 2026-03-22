import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../context/SettingsContext';

export default function BottomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { colors } = useTheme();

  const tabs = state.routes.map((route, index) => {
    const { options } = descriptors[route.key];
    const label =
      typeof options.tabBarLabel === 'string'
        ? options.tabBarLabel
        : route.name;
    const isFocused = state.index === index;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    const onLongPress = () => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    };

    return (
      <TouchableOpacity
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        onPress={onPress}
        onLongPress={onLongPress}
        style={[
          styles.tab,
          isFocused && {
            backgroundColor: colors.primaryContainer,
          },
        ]}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.label,
            {
              color: isFocused
                ? colors.onPrimary
                : colors.onSurface + '99',
            },
          ]}
          numberOfLines={1}
        >
          {label.toUpperCase()}
        </Text>
      </TouchableOpacity>
    );
  });

  // BlurView works best on iOS; fall back to semi-transparent on Android
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={60}
        tint="systemChromeMaterialLight"
        style={[styles.container, { shadowColor: colors.onSurface }]}
      >
        {tabs}
      </BlurView>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface + 'F7',
          shadowColor: colors.onSurface,
        },
      ]}
    >
      {tabs}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 28,
    paddingHorizontal: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderTopWidth: 0,
    // Subtle top shadow
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    ...Platform.select({
      android: {
        elevation: 8,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  label: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
  },
});
