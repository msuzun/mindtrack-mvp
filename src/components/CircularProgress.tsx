import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ThemeColors } from '../theme';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function CircularProgress({ percent, completed, total, size = 142 }: {
  percent: number; completed: number; total: number; size?: number;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const progress = useRef(new Animated.Value(0)).current;
  const strokeWidth = 11;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePercent = Math.max(0, Math.min(100, percent));

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: safePercent,
      duration: 720,
      useNativeDriver: false,
    }).start();
  }, [progress, safePercent]);

  const dashOffset = progress.interpolate({
    inputRange: [0, 100], outputRange: [circumference, 0],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}
      accessible accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: safePercent }}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.surfaceRaised}
          strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle cx={size / 2} cy={size / 2} r={radius} stroke={colors.success}
          strokeWidth={strokeWidth} fill="none" strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset} rotation="-90" origin={`${size / 2}, ${size / 2}`} />
      </Svg>
      <View style={styles.label} pointerEvents="none">
        <Text style={styles.percent}>%{safePercent}</Text>
        <Text style={styles.count}>{completed}/{total} görev</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  svg: { position: 'absolute' },
  label: { alignItems: 'center' },
  percent: { color: colors.textPrimary, fontSize: 27, fontWeight: '800' },
  count: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginTop: 2 },
});
