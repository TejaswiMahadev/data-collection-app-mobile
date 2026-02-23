import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Alert, Keyboard } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';
import { t } from '@/lib/i18n';
import { getRecord, saveRecord } from '@/lib/storage';
import { FieldRecord, ZoneData } from '@/lib/types';
import { playVoiceInstruction, stopVoiceInstruction } from '@/lib/tts';
import { StepInput, StepPicker } from '@/components/StepInput';
import { ProgressBar } from '@/components/ProgressBar';
import { PhotoGuidanceModal } from '@/components/PhotoGuidanceModal';
import { VoiceEntryOverlay } from '@/components/VoiceEntryOverlay';
import { GuidanceImages } from '@/constants/assets';
import { TTSButton } from '@/components/TTSButton';

const ZONE_COLORS = {
  A: Colors.zoneGood,
  B: Colors.zoneMedium,
  C: Colors.zoneWeak,
};

export default function ZoneCaptureScreen() {
  const insets = useSafeAreaInsets();
  const { language, isVoiceOn } = useApp();
  const { recordId } = useLocalSearchParams<{ recordId: string }>();
  const [record, setRecord] = useState<FieldRecord | null>(null);
  const [activeZone, setActiveZone] = useState<'A' | 'B' | 'C'>('A');
  const [zoneStep, setZoneStep] = useState(0);
  const [guidanceVisible, setGuidanceVisible] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState<'crop' | 'cob'>('crop');
  const activeZoneRef = useRef<'A' | 'B' | 'C'>('A');
  const recordRef = useRef<FieldRecord | null>(null);
  const photoAdvancedRef = useRef<Record<string, boolean>>({});
  const [voiceVisible, setVoiceVisible] = useState(false);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  useEffect(() => { activeZoneRef.current = activeZone; }, [activeZone]);
  useEffect(() => { recordRef.current = record; }, [record]);

  useEffect(() => { loadRecord(); }, []);

  const loadRecord = async () => {
    if (recordId) {
      const r = await getRecord(recordId);
      if (r) setRecord(r);
    }
  };

  const getZone = (): ZoneData => record!.zones.find(z => z.zoneId === activeZone)!;

  const updateZone = async (updates: Partial<ZoneData>) => {
    if (!record) return;
    const newZones = record.zones.map(z =>
      z.zoneId === activeZoneRef.current ? { ...z, ...updates } : z
    );
    const updated = { ...record, zones: newZones };
    setRecord(updated);
    await saveRecord(updated);
    return updated;
  };

  const checkDataComplete = (rec: FieldRecord) => {
    const zone = rec.zones.find(z => z.zoneId === activeZoneRef.current)!;
    return !!(zone.plantHeight && zone.plantColor && zone.standDensity && zone.cobSizeObserved && zone.plantsSampled);
  };

  const completeCurrentZone = async () => {
    if (!recordRef.current) return;
    const newZones = recordRef.current.zones.map(z =>
      z.zoneId === activeZoneRef.current ? { ...z, completed: true } : z
    );
    const updated = { ...recordRef.current, zones: newZones };
    setRecord(updated);
    await saveRecord(updated);
    recordRef.current = updated;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(() => {
      if (activeZoneRef.current === 'A') {
        setActiveZone('B');
        setZoneStep(0);
        photoAdvancedRef.current = {};
      } else if (activeZoneRef.current === 'B') {
        setActiveZone('C');
        setZoneStep(0);
        photoAdvancedRef.current = {};
      } else {
        router.push({ pathname: '/agronomic', params: { recordId: updated.id } });
      }
    }, 500);
  };

  const handleCapturePress = (type: 'crop' | 'cob') => {
    setCurrentPhotoType(type);
    setGuidanceVisible(true);
  };

  const takeZonePhoto = async () => {
    setGuidanceVisible(false);
    const type = currentPhotoType;
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        if (type === 'crop') {
          await updateZone({ cropPhotoUri: result.assets[0].uri });
        } else {
          await updateZone({ cobPhotoUri: result.assets[0].uri });
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {
      Alert.alert('Error', 'Could not open camera');
    }
  };

  useEffect(() => {
    if (!record) return;
    const zone = record.zones.find(z => z.zoneId === activeZone)!;
    const key = `${activeZone}-${zoneStep}`;
    if (zoneStep === 0 && zone.cropPhotoUri && !photoAdvancedRef.current[key]) {
      photoAdvancedRef.current[key] = true;
      const timer = setTimeout(() => setZoneStep(1), 600);
      return () => clearTimeout(timer);
    }
    if (zoneStep === 1 && zone.cobPhotoUri && !photoAdvancedRef.current[key]) {
      photoAdvancedRef.current[key] = true;
      const timer = setTimeout(() => setZoneStep(2), 600);
      return () => clearTimeout(timer);
    }
  }, [record, zoneStep, activeZone]);

  const voiceKeys = ['viStandingCrop', 'viCobCloseup', 'viZoneData'];

  useEffect(() => {
    if (isVoiceOn && record) {
      playVoiceInstruction(t(voiceKeys[zoneStep] as any, language), language);
    }
    return () => {
      stopVoiceInstruction();
    };
  }, [zoneStep, activeZone, isVoiceOn, language, !!record]);

  const handlePickerSelect = async (field: keyof ZoneData, value: string) => {
    const updated = await updateZone({ [field]: value });
    if (updated && checkDataComplete(updated)) {
      setTimeout(() => completeCurrentZone(), 400);
    }
  };

  if (!record) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontFamily: 'Nunito_400Regular', color: Colors.textSecondary }}>Loading...</Text>
      </View>
    );
  }

  const zone = getZone();
  const zoneLabels = {
    A: t('zoneA', language),
    B: t('zoneB', language),
    C: t('zoneC', language),
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary]}
        style={[styles.header, { paddingTop: topPad + 12 }]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('zoneIdentification', language)}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.zoneTabs}>
          {(['A', 'B', 'C'] as const).map((z) => {
            const zd = record.zones.find(zn => zn.zoneId === z)!;
            const isActive = activeZone === z;
            return (
              <Pressable
                key={z}
                style={[
                  styles.zoneTab,
                  isActive && { backgroundColor: ZONE_COLORS[z], borderColor: ZONE_COLORS[z] },
                  zd.completed && !isActive && { borderColor: ZONE_COLORS[z] },
                ]}
                onPress={() => {
                  if (z === 'A' || record.zones.find(zn => zn.zoneId === (['', 'A', 'B'][['A', 'B', 'C'].indexOf(z)] as any))?.completed) {
                    setActiveZone(z);
                    setZoneStep(0);
                  }
                }}
              >
                {zd.completed && (
                  <Ionicons name="checkmark-circle" size={16} color={isActive ? Colors.white : ZONE_COLORS[z]} />
                )}
                <Text style={[
                  styles.zoneTabText,
                  isActive && { color: Colors.white },
                  !isActive && zd.completed && { color: ZONE_COLORS[z] },
                ]}>
                  Zone {z}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: bottomPad + 40 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.zoneBanner, { backgroundColor: ZONE_COLORS[activeZone] + '15' }]}>
          <View style={[styles.zoneDot, { backgroundColor: ZONE_COLORS[activeZone] }]} />
          <Text style={[styles.zoneBannerText, { color: ZONE_COLORS[activeZone] }]}>
            {zoneLabels[activeZone]}
          </Text>
          <ProgressBar current={zoneStep + 1} total={3} />
        </View>

        <Animated.View
          key={`zone-${activeZone}-${zoneStep}`}
          entering={Platform.OS === 'web' ? FadeIn.duration(250) : SlideInRight.duration(300).springify().damping(20)}
        >
          {zoneStep === 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{t('standingCropPhoto', language)}</Text>
              </View>
              {zone.cropPhotoUri ? (
                <Animated.View entering={FadeIn.duration(400)} style={styles.photoWrap}>
                  <Image source={{ uri: zone.cropPhotoUri }} style={styles.photo} contentFit="contain" />
                  <View style={styles.autoTag}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.white} />
                    <Text style={styles.autoTagText}>Moving on...</Text>
                  </View>
                </Animated.View>
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.captureBtn, pressed && { opacity: 0.8 }]}
                  onPress={() => handleCapturePress('crop')}
                >
                  <Ionicons name="camera" size={32} color={Colors.primary} />
                  <Text style={styles.captureBtnText}>{t('capture', language)}</Text>
                </Pressable>
              )}
            </View>
          )}

          {zoneStep === 1 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{t('cobCloseup', language)}</Text>
              </View>
              {zone.cobPhotoUri ? (
                <Animated.View entering={FadeIn.duration(400)} style={styles.photoWrap}>
                  <Image source={{ uri: zone.cobPhotoUri }} style={styles.photo} contentFit="contain" />
                  <View style={styles.autoTag}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.white} />
                    <Text style={styles.autoTagText}>Moving on...</Text>
                  </View>
                </Animated.View>
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.captureBtn, pressed && { opacity: 0.8 }]}
                  onPress={() => handleCapturePress('cob')}
                >
                  <Ionicons name="camera" size={32} color={Colors.primary} />
                  <Text style={styles.captureBtnText}>{t('capture', language)}</Text>
                </Pressable>
              )}
            </View>
          )}

          {zoneStep === 2 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{t('zoneData', language)}</Text>
              </View>
              <StepInput
                label={t('plantHeight', language)}
                value={zone.plantHeight || ''}
                onChangeText={(v) => updateZone({ plantHeight: v })}
                placeholder="e.g. 180 cm"
                autoFocus={true}
                autoAdvanceDelay={1200}
                onSubmit={() => { }}
                type="number"
              />
              <StepPicker
                label={t('plantColor', language)}
                value={zone.plantColor || ''}
                options={[
                  { label: t('green', language), value: 'green' },
                  { label: t('yellowGreen', language), value: 'yellow-green' },
                  { label: t('yellow', language), value: 'yellow' },
                  { label: t('brown', language), value: 'brown' },
                ]}
                onSelect={(v) => handlePickerSelect('plantColor', v)}
              />
              <StepPicker
                label={t('standDensity', language)}
                value={zone.standDensity || ''}
                options={[
                  { label: t('low', language), value: 'low' },
                  { label: t('medium', language), value: 'medium' },
                  { label: t('high', language), value: 'high' },
                ]}
                onSelect={(v) => handlePickerSelect('standDensity', v)}
              />
              <StepPicker
                label={t('cobSizeObserved', language)}
                value={zone.cobSizeObserved || ''}
                options={[
                  { label: t('small', language), value: 'small' },
                  { label: t('medium', language), value: 'medium' },
                  { label: t('large', language), value: 'large' },
                ]}
                onSelect={(v) => handlePickerSelect('cobSizeObserved', v)}
              />
              <StepInput
                label={t('plantsSampled', language)}
                value={zone.plantsSampled || ''}
                onChangeText={(v) => {
                  const updated = updateZone({ plantsSampled: v });
                }}
                placeholder="e.g. 10"
                returnKeyType="done"
                autoAdvanceDelay={1200}
                onSubmit={() => {
                  if (recordRef.current && checkDataComplete(recordRef.current)) {
                    completeCurrentZone();
                  }
                }}
                type="number"
              />
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <PhotoGuidanceModal
        visible={guidanceVisible}
        onClose={() => setGuidanceVisible(false)}
        onCapture={takeZonePhoto}
        language={language}
        title={currentPhotoType === 'crop' ? t('standingCropPhoto', language) : t('cobCloseup', language)}
        instruction={currentPhotoType === 'crop' ? t('fieldOverviewInstruction', language) : t('cobCloseup', language)}
        type={currentPhotoType === 'crop' ? 'wide' : 'closeup'}
        exampleImage={currentPhotoType === 'crop' ? GuidanceImages.fieldWide : GuidanceImages.cobCloseup}
      />

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
        onApply={async (fields) => {
          const { zoneUpdates, ...mainFields } = fields as any;
          if (zoneUpdates) {
            await updateZone(zoneUpdates);
          }
          if (Object.keys(mainFields).length > 0) {
            setRecord(prev => prev ? { ...prev, ...mainFields } : null);
            if (recordRef.current) {
              const updated = { ...recordRef.current, ...mainFields };
              recordRef.current = updated;
              await saveRecord(updated);
            }
          }
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      />
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
  zoneTabs: {
    flexDirection: 'row',
    gap: 10,
  },
  zoneTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  zoneTabText: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: 'rgba(255,255,255,0.7)',
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  zoneBanner: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'column',
    gap: 8,
  },
  zoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    top: 16,
    left: 14,
  },
  zoneBannerText: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    marginLeft: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
    flex: 1,
  },
  captureBtn: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderStyle: 'dashed',
    gap: 8,
  },
  captureBtnText: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.primary,
  },
  photoWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
  },
  autoTag: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  autoTagText: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    color: Colors.white,
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
