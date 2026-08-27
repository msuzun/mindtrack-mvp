import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

const PARTICLES = [
  { x: -30, y: -24, size: 5 }, { x: -9, y: -36, size: 4 },
  { x: 20, y: -30, size: 5 }, { x: 34, y: -4, size: 4 },
  { x: 25, y: 25, size: 5 }, { x: 0, y: 34, size: 4 },
  { x: -27, y: 24, size: 5 }, { x: -36, y: 2, size: 4 },
] as const;

export function CompletionSparkle({ trigger }: { trigger: number }) {
  const { colors } = useTheme();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger === 0) return;
    progress.stopAnimation();
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [progress, trigger]);

  return (
    <View pointerEvents="none" style={styles.layer} accessibilityElementsHidden>
      {PARTICLES.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              width: particle.size,
              height: particle.size,
              borderRadius: particle.size / 2,
              backgroundColor: index % 2 === 0 ? colors.success : colors.accent,
              opacity: progress.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0, 1, 0] }),
              transform: [
                { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, particle.x] }) },
                { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, particle.y] }) },
                { scale: progress.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.4, 1, 0.65] }) },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 31, top: 31, width: 1, height: 1, zIndex: 10 },
  particle: { position: 'absolute' },
});
