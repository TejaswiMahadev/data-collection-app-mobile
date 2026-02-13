import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';
import { t } from '@/lib/i18n';
import { getRecord, saveRecord } from '@/lib/storage';
import { FieldRecord, ZoneData } from '@/lib/types';
import { StepInput, StepPicker } from '@/components/StepInput';
import { ProgressBar } from '@/components/ProgressBar';

const ZONE_COLORS = {
  A: Colors.zoneGood,
  B: Colors.zoneMedium,
  C: Colors.zoneWeak,
};

export default function ZoneCaptureScreen() {
  const insets = useSafeAreaInsets();
  const { language } = useApp();
  const { recordId } = useLocalSearchParams<{ recordId: string }>();
  const [record, setRecord] = useState<FieldRecord | null>(null);
  const [activeZone, setActiveZone] = useState<'A' | 'B' | 'C'>('A');
  const [zoneStep, setZoneStep] = useState(0);
  const zoneStepRef = useRef(0);
  const activeZoneRef = useRef<'A' | 'B' | 'C'>('A');

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  useEffect(() => {
    zoneStepRef.current = zoneStep;
  }, [zoneStep]);

  useEffect(() => {
    activeZoneRef.current = activeZone;
  }, [activeZone]);

  useEffect(() => {
    loadRecord();
  }, []);

  const loadRecord = async () => {
    if (recordId) {
      const r = await getRecord(recordId);
      if (r) setRecord(r);
    }
  };

  const getZone = (): ZoneData => {
    return record!.zones.find(z => z.zoneId === activeZone)!;
  };

  const updateZone = (updates: Partial<ZoneData>, autoAdvance = false) => {
    if (!record) return;
    const newZones = record.zones.map(z =>
      z.zoneId === activeZoneRef.current ? { ...z, ...updates } : z
    );
    const updated = { ...record, zones: newZones };
    setRecord(updated);
    saveRecord(updated);

    if (autoAdvance) {
      const zone = newZones.find(z => z.zoneId === activeZoneRef.current)!;
      const allDataFilled = zone.plantHeight && zone.plantColor && zone.standDensity && zone.cobSizeObserved && zone.plantsSampled;
      if (allDataFilled) {
        setTimeout(() => {
          completeCurrentZone(updated);
        }, 400);
      }
    }
  };

  const completeCurrentZone = (rec: FieldRecord) => {
    const newZones = rec.zones.map(z =>
      z.zoneId === activeZoneRef.current ? { ...z, completed: true } : z
    );
    const updated = { ...rec, zones: newZones };
    setRecord(updated);
    saveRecord(updated);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (activeZoneRef.current === 'A') {
      setActiveZone('B');
      setZoneStep(0);
    } else if (activeZoneRef.current === 'B') {
      setActiveZone('C');
      setZoneStep(0);
    } else {
      router.push({ pathname: '/agronomic', params: { recordId: updated.id } });
    }
  };

  const takeZonePhoto = async (type: 'crop' | 'cob') => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        if (type === 'crop') {
          updateZone({ cropPhotoUri: result.assets[0].uri });
        } else {
          updateZone({ cobPhotoUri: result.assets[0].uri });
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => {
          setZoneStep(prev => prev + 1);
        }, 500);
      }
    } catch {
      Alert.alert('Error', 'Could not open camera');
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
                  if (z === 'A' || record.zones.find(zn => zn.zoneId === (['', 'A', 'B'][['A','B','C'].indexOf(z)] as any))?.completed) {
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

        {zoneStep === 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('standingCropPhoto', language)}</Text>
            {zone.cropPhotoUri ? (
              <View style={styles.photoWrap}>
                <Image source={{ uri: zone.cropPhotoUri }} style={styles.photo} contentFit="cover" />
                <View style={styles.autoTag}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.white} />
                  <Text style={styles.autoTagText}>Auto-advancing...</Text>
                </View>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.captureBtn, pressed && { opacity: 0.8 }]}
                onPress={() => takeZonePhoto('crop')}
              >
                <Ionicons name="camera" size={32} color={Colors.primary} />
                <Text style={styles.captureBtnText}>{t('capture', language)}</Text>
              </Pressable>
            )}
          </View>
        )}

        {zoneStep === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('cobCloseup', language)}</Text>
            {zone.cobPhotoUri ? (
              <View style={styles.photoWrap}>
                <Image source={{ uri: zone.cobPhotoUri }} style={styles.photo} contentFit="cover" />
                <View style={styles.autoTag}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.white} />
                  <Text style={styles.autoTagText}>Auto-advancing...</Text>
                </View>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.captureBtn, pressed && { opacity: 0.8 }]}
                onPress={() => takeZonePhoto('cob')}
              >
                <Ionicons name="camera" size={32} color={Colors.primary} />
                <Text style={styles.captureBtnText}>{t('capture', language)}</Text>
              </Pressable>
            )}
          </View>
        )}

        {zoneStep === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('zoneData', language)}</Text>
            <StepInput
              label={t('plantHeight', language)}
              value={zone.plantHeight || ''}
              onChangeText={(v) => updateZone({ plantHeight: v })}
              placeholder="e.g. 180 cm"
              autoFocus={true}
              onSubmit={() => {}}
            />
            <StepPicker
              label={t('plantColor', language)}
              value={zone.plantColor || ''}
              options={[
                { label: 'Green', value: 'green' },
                { label: 'Yellow-Green', value: 'yellow-green' },
                { label: 'Yellow', value: 'yellow' },
                { label: 'Brown', value: 'brown' },
              ]}
              onSelect={(v) => updateZone({ plantColor: v })}
            />
            <StepPicker
              label={t('standDensity', language)}
              value={zone.standDensity || ''}
              options={[
                { label: t('low', language), value: 'low' },
                { label: t('medium', language), value: 'medium' },
                { label: t('high', language), value: 'high' },
              ]}
              onSelect={(v) => updateZone({ standDensity: v })}
            />
            <StepPicker
              label={t('cobSizeObserved', language)}
              value={zone.cobSizeObserved || ''}
              options={[
                { label: t('small', language), value: 'small' },
                { label: t('medium', language), value: 'medium' },
                { label: t('large', language), value: 'large' },
              ]}
              onSelect={(v) => updateZone({ cobSizeObserved: v })}
            />
            <StepInput
              label={t('plantsSampled', language)}
              value={zone.plantsSampled || ''}
              onChangeText={(v) => updateZone({ plantsSampled: v })}
              keyboardType="numeric"
              placeholder="e.g. 10"
              returnKeyType="done"
              onSubmit={() => {
                const z = record.zones.find(zn => zn.zoneId === activeZoneRef.current)!;
                if (z.plantHeight && z.plantColor && z.standDensity && z.cobSizeObserved) {
                  completeCurrentZone(record);
                }
              }}
            />
          </View>
        )}
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
  cardTitle: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
    marginBottom: 16,
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
});
