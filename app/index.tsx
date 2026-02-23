import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';
import { t } from '@/lib/i18n';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const { language, selfieUri, isLanguageSet, isVoicePrefSet } = useApp();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const leafRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(leafRotate, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(leafRotate, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 800);

    const timer = setTimeout(() => {
      if (!isLanguageSet) {
        router.replace('/language-select');
      } else if (!isVoicePrefSet) {
        router.replace('/voice-prompt');
      } else if (selfieUri) {
        router.replace('/dashboard');
      } else {
        router.replace('/selfie');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const leafSpin = leafRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '10deg'],
  });

  return (
    <LinearGradient
      colors={[Colors.primaryDark, Colors.primary, '#43A047']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <Animated.View style={[styles.iconWrap, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Animated.View style={{ transform: [{ rotate: leafSpin }] }}>
          <Ionicons name="leaf" size={80} color={Colors.accentLight} />
        </Animated.View>
      </Animated.View>

      <Animated.Text style={[styles.title, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {t('appName', language)}
      </Animated.Text>

      <Animated.Text style={[styles.subtitle, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {t('tagline', language)}
      </Animated.Text>

      <Animated.View style={[styles.dots, { opacity: fadeAnim }]}>
        <View style={[styles.dot, { backgroundColor: Colors.accentLight }]} />
        <View style={[styles.dot, { backgroundColor: Colors.accent, width: 24 }]} />
        <View style={[styles.dot, { backgroundColor: Colors.accentLight }]} />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorCircle1: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  iconWrap: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 42,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.white,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Nunito_400Regular',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 8,
  },
  dots: {
    flexDirection: 'row',
    marginTop: 40,
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
