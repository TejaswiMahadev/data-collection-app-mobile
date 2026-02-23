import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Alert, Keyboard } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';
import { t } from '@/lib/i18n';
import { getRecord, saveRecord } from '@/lib/storage';
import { FieldRecord } from '@/lib/types';
import { playVoiceInstruction, stopVoiceInstruction } from '@/lib/tts';
import { StepInput, StepPicker } from '@/components/StepInput';
import { ProgressBar } from '@/components/ProgressBar';
import { VoiceEntryOverlay } from '@/components/VoiceEntryOverlay';
import { TTSButton } from '@/components/TTSButton';

export default function FarmerInfoScreen() {
  const insets = useSafeAreaInsets();
  const { language, isVoiceOn } = useApp();
  const { recordId } = useLocalSearchParams<{ recordId: string }>();
  const [record, setRecord] = useState<FieldRecord | null>(null);
  const [step, setStep] = useState(0);
  const recordRef = useRef<FieldRecord | null>(null);
  const advancedRef = useRef<Record<number, boolean>>({});
  const [voiceVisible, setVoiceVisible] = useState(false);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  useEffect(() => { recordRef.current = record; }, [record]);

  useEffect(() => {
    if (recordId) getRecord(recordId).then(r => r && setRecord(r));
  }, []);

  const update = useCallback(async (key: keyof FieldRecord, value: string) => {
    if (!recordRef.current) return;
    const updated = { ...recordRef.current, [key]: value };
    setRecord(updated);
    recordRef.current = updated;
    await saveRecord(updated);
  }, []);

  const goToStep = useCallback((s: number) => {
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    advancedRef.current = {};
    setStep(s);
  }, []);

  const goToReview = useCallback(() => {
    if (!recordRef.current) return;
    const r = recordRef.current;
    if (r.farmerPhone && r.farmerPhone.length !== 10) {
      Alert.alert(t('validationError', language), t('phoneValidation', language));
      return;
    }
    if (r.collectorPhone && r.collectorPhone.length !== 10) {
      Alert.alert(t('validationError', language), t('phoneValidation', language));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/review', params: { recordId: r.id } });
  }, [language]);

  if (!record) return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><Text style={{ fontFamily: 'Nunito_400Regular', color: Colors.textSecondary }}>Loading...</Text></View>;

  const stepTitles = [
    t('farmerName', language),
    t('farmerPhone', language),
    t('landOwnership', language),
    t('consent', language),
    t('collectorName', language),
    t('collectorPhone', language),
    t('timeSpent', language),
  ];

  useEffect(() => {
    if (isVoiceOn && stepTitles[step]) {
      playVoiceInstruction(stepTitles[step], language);
    }
    return () => {
      stopVoiceInstruction();
    };
  }, [step, isVoiceOn, language]);

  const renderStep = () => {
    switch (step) {
      case 0:
        return <StepInput label={t('farmerName', language)} value={record.farmerName} onChangeText={(v) => update('farmerName', v)} placeholder="e.g. Rajesh Kumar" autoFocus={true} autoAdvanceDelay={1200} onSubmit={() => goToStep(1)} />;
      case 1:
        return <StepInput label={t('farmerPhone', language)} value={record.farmerPhone} onChangeText={(v) => update('farmerPhone', v)} keyboardType="phone-pad" placeholder="10 digits" autoAdvanceLength={10} onSubmit={() => goToStep(2)} />;
      case 2:
        return <StepPicker label={t('landOwnership', language)} value={record.landOwnership} options={[
          { label: t('owner', language), value: 'owner' },
          { label: t('tenant', language), value: 'tenant' },
          { label: t('leased', language), value: 'leased' },
        ]} onSelect={(v) => { update('landOwnership', v); setTimeout(() => goToStep(3), 400); }} />;
      case 3:
        return <StepPicker label={t('consent', language)} value={record.consent} options={[
          { label: t('yes', language), value: 'yes' },
          { label: t('no', language), value: 'no' },
        ]} onSelect={(v) => { update('consent', v); setTimeout(() => goToStep(4), 400); }} />;
      case 4:
        return <StepInput label={t('collectorName', language)} value={record.collectorName} onChangeText={(v) => update('collectorName', v)} placeholder="e.g. Amit Singh" autoFocus={true} autoAdvanceDelay={1200} onSubmit={() => goToStep(5)} />;
      case 5:
        return <StepInput label={t('collectorPhone', language)} value={record.collectorPhone} onChangeText={(v) => update('collectorPhone', v)} keyboardType="phone-pad" placeholder="10 digits" autoAdvanceLength={10} onSubmit={() => goToStep(6)} />;
      case 6:
        return <StepInput label={t('timeSpent', language)} value={record.timeSpent} onChangeText={(v) => update('timeSpent', v)} keyboardType="numeric" placeholder="e.g. 45 min" autoFocus={true} autoAdvanceDelay={1500} returnKeyType="done" onSubmit={goToReview} />;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => { if (step > 0) goToStep(step - 1); else router.back(); }} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('farmerInfo', language)}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ProgressBar current={step + 1} total={7} />
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: bottomPad + 40 }} keyboardShouldPersistTaps="handled">
        <Animated.View
          key={`farmer-step-${step}`}
          entering={Platform.OS === 'web' ? FadeIn.duration(250) : SlideInRight.duration(300).springify().damping(20)}
          style={styles.card}
        >
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{step + 1}</Text>
            </View>
            <Text style={styles.stepTitle}>{stepTitles[step]}</Text>
            <TTSButton text={stepTitles[step]} language={language} />
          </View>
          {renderStep()}
        </Animated.View>
      </ScrollView>

      <View style={[styles.fabContainer, { bottom: bottomPad + 20 }]}>
        <Pressable
          style={({ pressed }) => [styles.voiceFab, pressed && { transform: [{ scale: 0.95 }] }]}
          onPress={() => setVoiceVisible(true)}
        >
          <Ionicons name="mic" size={28} color={Colors.white} />
        </Pressable>
      </View>

      <VoiceEntryOverlay
        visible={voiceVisible}
        onClose={() => setVoiceVisible(false)}
        language={language}
        onApply={(fields) => {
          if (!recordRef.current) return;
          const updated = { ...recordRef.current, ...fields };
          setRecord(updated);
          recordRef.current = updated;
          saveRecord(updated);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Nunito_700Bold', color: Colors.white },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  card: {
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
    flex: 1,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  voiceFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
