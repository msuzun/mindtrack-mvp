import { ReactNode, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';

export function Floating({ children }: { children: ReactNode }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      translateY.stopAnimation();
      translateY.setValue(0);
      return;
    }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(translateY, { toValue: -6, duration: 1500, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 6, duration: 1500, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [reduceMotion, translateY]);

  return <Animated.View style={{ transform: [{ translateY }] }}>{children}</Animated.View>;
}
