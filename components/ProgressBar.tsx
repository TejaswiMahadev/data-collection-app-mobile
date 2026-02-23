import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import Colors from '@/constants/colors';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const progress = total > 0 ? (current / total) * 100 : 0;
  const animWidth = useSharedValue(0);

  useEffect(() => {
    animWidth.value = withTiming(Math.min(progress, 100), {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${animWidth.value}%`,
  }));

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.count}>{current}/{total}</Text>
        </View>
      )}
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.textSecondary,
  },
  count: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.primary,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
});
