import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme, useSettings } from "../context/SettingsContext";

interface ScreenHeaderProps {
  showPageName?: string;
}

export default function ScreenHeader({ showPageName }: ScreenHeaderProps) {
  const { colors } = useTheme();
  const { settings } = useSettings();
  const initial = settings.displayName?.charAt(0)?.toUpperCase() || "?";

  const content = (
    <>
      {/* Left side: hamburger + app title */}
      <View style={styles.left}>
        <TouchableOpacity activeOpacity={0.6}>
          <Text style={[styles.hamburger, { color: colors.primary }]}>
            {"\u2630"}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.primary }]}>Sanctuary</Text>
      </View>

      {/* Right side: optional page name + avatar */}
      <View style={styles.right}>
        {showPageName != null && (
          <Text style={[styles.pageName, { color: colors.primary }]}>
            {showPageName}
          </Text>
        )}
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.surfaceContainerHigh },
          ]}
        >
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {initial}
          </Text>
        </View>
      </View>
    </>
  );

  // BlurView works best on iOS; fall back to semi-transparent on Android
  if (Platform.OS === "ios") {
    return (
      <BlurView intensity={60} tint="systemChromeMaterialLight" style={styles.container}>
        {content}
      </BlurView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface + "F2" }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  hamburger: {
    fontSize: 22,
  },
  title: {
    fontFamily: "Newsreader_400Regular_Italic",
    fontSize: 22,
    marginLeft: 12,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pageName: {
    fontFamily: "Newsreader_400Regular_Italic",
    fontSize: 22,
    fontStyle: "italic",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
  },
});
