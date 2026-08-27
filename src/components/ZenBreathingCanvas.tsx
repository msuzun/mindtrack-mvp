import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

export function ZenBreathingCanvas({ active }: { active: boolean }) {
  const { colors } = useTheme();
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted || reduceMotion || !active) {
        breath.setValue(0);
        return;
      }
      loop = Animated.loop(Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ]));
      loop.start();
    });
    return () => {
      mounted = false;
      loop?.stop();
    };
  }, [active, breath]);

  return (
    <View style={styles.frame} pointerEvents="none" accessibilityElementsHidden>
      <View style={[styles.glow, { backgroundColor: colors.illustrationGlowPrimary }]} />
      <Animated.View style={{
        opacity: breath.interpolate({ inputRange: [0, 1], outputRange: [0.68, 1] }),
        transform: [{ scale: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }],
      }}>
        <Svg width={270} height={270} viewBox="0 0 270 270">
          <Defs>
            <LinearGradient id="zen" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.accent} stopOpacity="0.8" />
              <Stop offset="1" stopColor={colors.success} stopOpacity="0.45" />
            </LinearGradient>
          </Defs>
          <Circle cx="135" cy="135" r="104" fill={colors.illustrationFill} stroke="url(#zen)" strokeWidth="2" />
          <Circle cx="135" cy="135" r="87" fill="none" stroke={colors.illustrationLine} strokeOpacity="0.25" strokeWidth="1" strokeDasharray="3 9" />
          <Path d="M62 143c21-15 38-15 57 0s37 15 58 0 35-15 48-3" fill="none" stroke="url(#zen)" strokeWidth="3" strokeLinecap="round" />
          <Path d="M82 159c18-11 34-10 50 2s32 12 52 0" fill="none" stroke={colors.illustrationLine} strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
          <Ellipse cx="135" cy="189" rx="29" ry="6" fill={colors.illustrationGlowSecondary} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: 290, height: 290, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 240, height: 240, borderRadius: 120, transform: [{ scale: 1.18 }] },
});
