import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';
import { t } from '@/lib/i18n';
import { createEmptyRecord, FieldRecord } from '@/lib/types';
import { saveRecord } from '@/lib/storage';
import { StepInput } from '@/components/StepInput';
import { ProgressBar } from '@/components/ProgressBar';

const TOTAL_STEPS = 8;

export default function FieldEntryScreen() {
  const insets = useSafeAreaInsets();
  const { language } = useApp();
  const [record, setRecord] = useState<FieldRecord>(createEmptyRecord());
  const [step, setStep] = useState(0);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'capturing' | 'done'>('idle');

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  const update = (key: keyof FieldRecord, value: any) => {
    setRecord(prev => ({ ...prev, [key]: value }));
  };

  const captureGps = async () => {
    setGpsStatus('capturing');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'GPS permission is required');
        setGpsStatus('idle');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      update('latitude', loc.coords.latitude);
      update('longitude', loc.coords.longitude);
      update('gpsAccuracy', loc.coords.accuracy ?? 0);
      setGpsStatus('done');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setGpsStatus('idle');
      Alert.alert('GPS Error', 'Could not capture GPS location');
    }
  };

  const handleAcresChange = (val: string) => {
    update('fieldAreaAcres', val);
    const acres = parseFloat(val);
    if (!isNaN(acres)) {
      update('fieldAreaHectares', (acres * 0.404686).toFixed(2));
    } else {
      update('fieldAreaHectares', '');
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return record.fieldId.length > 0;
      case 1: return true;
      case 2: return gpsStatus === 'done';
      case 3: return record.district.length > 0;
      case 4: return record.block.length > 0;
      case 5: return record.village.length > 0;
      case 6: return record.fieldAreaAcres.length > 0;
      case 7: return true;
      default: return false;
    }
  };

  const nextStep = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      record.currentPhase = 4;
      await saveRecord(record);
      router.push({ pathname: '/photo-walk', params: { recordId: record.id } });
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  useEffect(() => {
    saveRecord(record);
  }, [record]);

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <StepInput
            label={t('fieldId', language)}
            value={record.fieldId}
            onChangeText={(v) => update('fieldId', v)}
            placeholder="e.g. F001"
          />
        );
      case 1:
        return (
          <StepInput
            label={t('collectionDate', language)}
            value={record.collectionDate}
            onChangeText={(v) => update('collectionDate', v)}
            placeholder="YYYY-MM-DD"
          />
        );
      case 2:
        return (
          <View>
            <Text style={styles.stepLabel}>{t('gpsLocation', language)}</Text>
            {gpsStatus === 'done' ? (
              <View style={styles.gpsCard}>
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
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.gpsBtn, pressed && { opacity: 0.8 }]}
                onPress={captureGps}
                disabled={gpsStatus === 'capturing'}
              >
                <Ionicons
                  name={gpsStatus === 'capturing' ? 'radio' : 'navigate'}
                  size={24}
                  color={Colors.white}
                />
                <Text style={styles.gpsBtnText}>
                  {gpsStatus === 'capturing' ? t('gpsCapturing', language) : t('captureGps', language)}
                </Text>
              </Pressable>
            )}
          </View>
        );
      case 3:
        return (
          <StepInput
            label={t('district', language)}
            value={record.district}
            onChangeText={(v) => update('district', v)}
            placeholder="e.g. Ranchi"
          />
        );
      case 4:
        return (
          <StepInput
            label={t('block', language)}
            value={record.block}
            onChangeText={(v) => update('block', v)}
            placeholder="e.g. Kanke"
          />
        );
      case 5:
        return (
          <StepInput
            label={t('village', language)}
            value={record.village}
            onChangeText={(v) => update('village', v)}
            placeholder="e.g. Dhurwa"
          />
        );
      case 6:
        return (
          <View>
            <StepInput
              label={t('fieldArea', language)}
              value={record.fieldAreaAcres}
              onChangeText={handleAcresChange}
              keyboardType="decimal-pad"
              placeholder="e.g. 2.5"
            />
            {record.fieldAreaHectares ? (
              <View style={styles.calcCard}>
                <Text style={styles.calcLabel}>{t('hectares', language)}</Text>
                <Text style={styles.calcValue}>{record.fieldAreaHectares} ha</Text>
              </View>
            ) : null}
          </View>
        );
      case 7:
        return (
          <View style={styles.summaryWrap}>
            <Text style={styles.summaryTitle}>{t('fieldInfo', language)}</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('fieldId', language)}</Text>
              <Text style={styles.summaryValue}>{record.fieldId}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('district', language)}</Text>
              <Text style={styles.summaryValue}>{record.district}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('block', language)}</Text>
              <Text style={styles.summaryValue}>{record.block}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('village', language)}</Text>
              <Text style={styles.summaryValue}>{record.village}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('fieldArea', language)}</Text>
              <Text style={styles.summaryValue}>{record.fieldAreaAcres} ac / {record.fieldAreaHectares} ha</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

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

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: bottomPad + 100 }}>
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{step + 1}</Text>
            </View>
            <Text style={styles.stepTitle}>{stepLabels[step]}</Text>
          </View>
          {renderStep()}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 16 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.nextBtn,
            !canProceed() && styles.nextBtnDisabled,
            pressed && canProceed() && { transform: [{ scale: 0.97 }] },
          ]}
          onPress={nextStep}
          disabled={!canProceed()}
        >
          <Text style={styles.nextBtnText}>
            {step === TOTAL_STEPS - 1 ? t('startFieldWalk', language) : t('next', language)}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
        </Pressable>
      </View>
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
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    justifyContent: 'center',
  },
  gpsBtnText: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: Colors.white,
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  nextBtnDisabled: {
    backgroundColor: Colors.borderLight,
  },
  nextBtnText: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
    color: Colors.white,
  },
});
