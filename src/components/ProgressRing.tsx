import React from "react";
import { View } from "react-native";

interface ProgressRingProps {
  size: number;
  strokeWidth?: number;
  progress: number; // 0-100
  trackColor: string;
  progressColor: string;
  /** Background color for the ring's center. Should match the parent surface. */
  innerColor?: string;
  children?: React.ReactNode;
}

/**
 * A circular progress ring built with pure React Native Views.
 * Uses the half-circle rotation technique -- no native SVG dependency.
 */
export default function ProgressRing({
  size,
  strokeWidth = 8,
  progress,
  trackColor,
  progressColor,
  innerColor = "transparent",
  children,
}: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  const half = size / 2;
  const innerSize = size - strokeWidth * 2;

  // Convert progress to degrees (0-360)
  const degrees = (clamped / 100) * 360;

  // For the half-circle technique we render two halves, each clipped to 180deg.
  // Right half covers 0-180 degrees, left half covers 180-360 degrees.
  const rightDeg = Math.min(degrees, 180);
  const leftDeg = Math.max(degrees - 180, 0);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {/* Track circle (full background ring) */}
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: half,
          borderWidth: strokeWidth,
          borderColor: trackColor,
        }}
      />

      {/* Right half (0-180 deg) */}
      <View
        style={{
          position: "absolute",
          width: half,
          height: size,
          left: half,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: size,
            height: size,
            borderRadius: half,
            borderWidth: strokeWidth,
            borderColor: progressColor,
            borderLeftColor: "transparent",
            borderBottomColor: "transparent",
            right: half,
            transform: [{ rotateZ: `${45 + rightDeg}deg` }],
          }}
        />
      </View>

      {/* Left half (180-360 deg) */}
      <View
        style={{
          position: "absolute",
          width: half,
          height: size,
          left: 0,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: size,
            height: size,
            borderRadius: half,
            borderWidth: strokeWidth,
            borderColor: leftDeg > 0 ? progressColor : "transparent",
            borderRightColor: "transparent",
            borderTopColor: "transparent",
            left: 0,
            transform: [{ rotateZ: `${225 + leftDeg}deg` }],
          }}
        />
      </View>

      {/* Inner circle — masks center for clean ring appearance */}
      <View
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          backgroundColor: innerColor,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </View>
    </View>
  );
}
