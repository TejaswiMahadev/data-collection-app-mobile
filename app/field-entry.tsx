import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Alert, Keyboard } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';
import { t } from '@/lib/i18n';
import { createEmptyRecord, FieldRecord } from '@/lib/types';
import { saveRecord } from '@/lib/storage';
import { playVoiceInstruction, stopVoiceInstruction } from '@/lib/tts';
import { StepInput } from '@/components/StepInput';
import { ProgressBar } from '@/components/ProgressBar';

const TOTAL_STEPS = 8;

export default function FieldEntryScreen() {
  const insets = useSafeAreaInsets();
  const { language, isVoiceOn } = useApp();
  const [record, setRecord] = useState<FieldRecord>(createEmptyRecord());
  const [step, setStep] = useState(0);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'capturing' | 'done'>('idle');
  const gpsAdvancedRef = useRef(false);
  const recordRef = useRef(record);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  useEffect(() => {
    recordRef.current = record;
  }, [record]);

  const update = useCallback((key: keyof FieldRecord, value: any) => {
    setRecord(prev => ({ ...prev, [key]: value }));
  }, []);

  const goToStep = useCallback((nextStep: number) => {
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(nextStep);
  }, []);

  const captureGps = useCallback(async () => {
    setGpsStatus('capturing');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsStatus('done');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Platform.OS === 'web' ? Location.Accuracy.Balanced : Location.Accuracy.High,
        timeInterval: 5000,
      });
      setRecord(prev => ({
        ...prev,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        gpsAccuracy: loc.coords.accuracy ?? 0,
      }));
      setGpsStatus('done');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setGpsStatus('done');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  useEffect(() => {
    if (gpsStatus === 'done' && step === 2 && !gpsAdvancedRef.current) {
      gpsAdvancedRef.current = true;
      const timer = setTimeout(() => {
        goToStep(3);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [gpsStatus, step, goToStep]);

  const handleAcresChange = useCallback((val: string) => {
    const acres = parseFloat(val);
    setRecord(prev => ({
      ...prev,
      fieldAreaAcres: val,
      fieldAreaHectares: !isNaN(acres) ? (acres * 0.404686).toFixed(2) : '',
    }));
  }, []);

  const handleFinalStep = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const r = { ...recordRef.current, currentPhase: 4 };
    await saveRecord(r);
    router.push({ pathname: '/photo-walk', params: { recordId: r.id } });
  };

  const prevStep = useCallback(() => {
    if (step > 0) {
      if (step === 3) gpsAdvancedRef.current = false;
      setStep(step - 1);
    } else {
      router.back();
    }
  }, [step]);

  useEffect(() => {
    if (step === 1 && record.collectionDate) {
      const timer = setTimeout(() => goToStep(2), 700);
      return () => clearTimeout(timer);
    }
    if (step === 2 && gpsStatus === 'idle') {
      captureGps();
    }
  }, [step]);

  useEffect(() => {
    saveRecord(record);
  }, [record]);

  const stepLabels = [
    t('fieldId', language),
    t('collectionDate', language),
    t('gpsLocation', language),
    t('district', language),
    t('block', language),
    t('village', language),
    t('fieldArea', language),
    t('review', language),
  ];

  const voiceKeys = [
    'viFieldId',
    'viCollectionDate',
    'viGpsLocation',
    'viDistrict',
    'viBlock',
    'viVillage',
    'viFieldArea',
    'review'
  ];

  useEffect(() => {
    if (isVoiceOn && step < 7) {
      playVoiceInstruction(t(voiceKeys[step] as any, language), language);
    }
    return () => {
      stopVoiceInstruction();
    };
  }, [step, isVoiceOn, language]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary]}
        style={[styles.header, { paddingTop: topPad + 12 }]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={prevStep} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('fieldIdentification', language)}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ProgressBar current={step + 1} total={TOTAL_STEPS} />
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: bottomPad + 40 }} keyboardShouldPersistTaps="handled">
        <Animated.View
          key={`step-${step}`}
          entering={Platform.OS === 'web' ? FadeIn.duration(250) : SlideInRight.duration(300).springify().damping(20)}
          style={styles.stepCard}
        >
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{step + 1}</Text>
            </View>
            <Text style={styles.stepTitle}>{stepLabels[step]}</Text>
          </View>

          {step === 0 && (
            <StepInput
              label={t('fieldId', language)}
              value={record.fieldId}
              onChangeText={(v) => update('fieldId', v)}
              onSubmit={() => goToStep(1)}
              autoFocus
              type="text"
            />
          )}

          {step === 1 && (
            <View>
              <StepInput
                label={t('collectionDate', language)}
                value={record.collectionDate}
                onChangeText={(v) => update('collectionDate', v)}
                onSubmit={() => goToStep(2)}
                autoFocus
                placeholder="YYYY-MM-DD"
                type="date"
              />
              <Animated.View entering={FadeIn.delay(200).duration(300)} style={styles.autoAdvanceHint}>
                <Ionicons name="time-outline" size={14} color={Colors.textLight} />
                <Text style={styles.autoAdvanceText}>Auto-advancing...</Text>
              </Animated.View>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.stepLabel}>{t('gpsLocation', language)}</Text>
              {gpsStatus === 'done' ? (
                <Animated.View entering={FadeIn.duration(400)} style={styles.gpsCard}>
                  <Ionicons name="location" size={24} color={Colors.success} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.gpsText}>{t('gpsCaptured', language)}</Text>
                    <Text style={styles.gpsCoords}>
                      {record.latitude?.toFixed(6)}, {record.longitude?.toFixed(6)}
                    </Text>
                    <Text style={styles.gpsAccuracy}>
                      Accuracy: {record.gpsAccuracy?.toFixed(0)}m
                    </Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                </Animated.View>
              ) : (
                <Animated.View entering={FadeIn.duration(300)} style={styles.gpsCapturing}>
                  <Ionicons name="radio" size={28} color={Colors.primary} />
                  <Text style={styles.gpsBtnText}>{t('gpsCapturing', language)}</Text>
                  <View style={styles.gpsPulse}>
                    <Text style={styles.gpsPulseText}>...</Text>
                  </View>
                </Animated.View>
              )}
            </View>
          )}

          {step === 3 && (
            <StepInput
              label={t('district', language)}
              value={record.district}
              onChangeText={(v) => update('district', v)}
              placeholder="e.g. Ranchi"
              autoFocus={true}
              autoAdvanceDelay={1200}
              onSubmit={() => record.district.length > 0 && goToStep(4)}
            />
          )}

          {step === 4 && (
            <StepInput
              label={t('block', language)}
              value={record.block}
              onChangeText={(v) => update('block', v)}
              placeholder="e.g. Kanke"
              autoFocus={true}
              autoAdvanceDelay={1200}
              onSubmit={() => record.block.length > 0 && goToStep(5)}
            />
          )}

          {step === 5 && (
            <StepInput
              label={t('village', language)}
              value={record.village}
              onChangeText={(v) => update('village', v)}
              placeholder="e.g. Dhurwa"
              autoFocus={true}
              autoAdvanceDelay={1200}
              onSubmit={() => record.village.length > 0 && goToStep(6)}
            />
          )}

          {step === 6 && (
            <View>
              <StepInput
                label={t('fieldArea', language)}
                value={record.fieldAreaAcres}
                onChangeText={handleAcresChange}
                onSubmit={() => goToStep(7)}
                autoFocus
                type="number"
              />
              {record.fieldAreaHectares ? (
                <Animated.View entering={FadeIn.duration(300)} style={styles.calcCard}>
                  <Text style={styles.calcLabel}>{t('hectares', language)}</Text>
                  <Text style={styles.calcValue}>{record.fieldAreaHectares} ha</Text>
                </Animated.View>
              ) : null}
            </View>
          )}

          {step === 7 && (
            <View style={styles.summaryWrap}>
              <Text style={styles.summaryTitle}>{t('fieldInfo', language)}</Text>
              {[
                { label: t('fieldId', language), val: record.fieldId },
                { label: t('district', language), val: record.district },
                { label: t('block', language), val: record.block },
                { label: t('village', language), val: record.village },
                { label: t('fieldArea', language), val: `${record.fieldAreaAcres} ac / ${record.fieldAreaHectares} ha` },
              ].map((item, i) => (
                <Animated.View key={item.label} entering={FadeIn.delay(i * 80).duration(300)} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{item.label}</Text>
                  <Text style={styles.summaryValue}>{item.val}</Text>
                </Animated.View>
              ))}

              <Pressable
                style={({ pressed }) => [styles.startWalkBtn, pressed && { transform: [{ scale: 0.97 }] }]}
                onPress={handleFinalStep}
              >
                <Ionicons name="walk" size={22} color={Colors.white} />
                <Text style={styles.startWalkText}>{t('startFieldWalk', language)}</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: Colors.white,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  stepCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: Colors.white,
  },
  stepTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
  },
  stepLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  gpsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
  },
  gpsText: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: Colors.success,
  },
  gpsCoords: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  gpsAccuracy: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textLight,
    marginTop: 2,
  },
  gpsCapturing: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 20,
    gap: 12,
    justifyContent: 'center',
  },
  gpsBtnText: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.primary,
  },
  gpsPulse: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsPulseText: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: Colors.primary,
  },
  calcCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  calcLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.textSecondary,
  },
  calcValue: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: Colors.primary,
  },
  summaryWrap: {},
  summaryTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.text,
  },
  startWalkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 10,
    marginTop: 28,
  },
  startWalkText: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
    color: Colors.white,
  },
  autoAdvanceHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  autoAdvanceText: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textLight,
  },
});
