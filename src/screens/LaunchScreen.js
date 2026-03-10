import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const START_DELAY_MS = 2200;

export default function LaunchScreen({ onDone }) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  const glow = useRef(new Animated.Value(0.4)).current;

  const stars = useMemo(
    () =>
      Array.from({ length: 20 }, (_, idx) => ({
        id: `star-${idx}`,
        left: `${(idx * 37) % 100}%`,
        top: `${(idx * 19) % 100}%`,
        size: idx % 3 === 0 ? 3 : 2,
        opacity: 0.1 + (idx % 5) * 0.12,
      })),
    []
  );

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.5,
          duration: 850,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    pulse.start();

    const doneTimeout = setTimeout(() => {
      pulse.stop();
      onDone?.();
    }, START_DELAY_MS);

    return () => {
      clearTimeout(doneTimeout);
      pulse.stop();
    };
  }, [fade, glow, onDone, scale]);

  return (
    <LinearGradient colors={['#030008', '#120b3e', '#2a0d54', '#011627']} style={styles.gradient}>
      <View style={styles.overlay}>
        {stars.map((star) => (
          <View
            key={star.id}
            style={[
              styles.star,
              {
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
                opacity: star.opacity,
              },
            ]}
          />
        ))}
      </View>

      <Animated.View style={[styles.content, { opacity: fade, transform: [{ scale }] }]}>
        <Animated.View style={[styles.glow, { opacity: glow }]} />
        <Text style={styles.title}>Aurora Australis</Text>
        <Text style={styles.subtitle}>Predictor</Text>
        <Text style={styles.tagline}>Loading live space weather conditions…</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#b3e5fc',
  },
  content: { alignItems: 'center', paddingHorizontal: 20 },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: '#7c4dff',
    opacity: 0.55,
  },
  title: {
    marginTop: 28,
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 0.8,
    textShadowColor: '#80deea',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  subtitle: {
    color: '#b39ddb',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
    textShadowColor: '#80deea',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  tagline: {
    marginTop: 20,
    color: '#c5cae9',
    fontSize: 14,
  },
});
