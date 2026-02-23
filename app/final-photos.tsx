import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Alert } from 'react-native';
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
import { FieldRecord } from '@/lib/types';
import { playVoiceInstruction, stopVoiceInstruction } from '@/lib/tts';
import { ProgressBar } from '@/components/ProgressBar';
import { PhotoGuidanceModal } from '@/components/PhotoGuidanceModal';
import { GuidanceImages } from '@/constants/assets';

const PHOTO_STEPS: { field: 'harvestPhotoUri' | 'weighmentPhotoUri' | 'farmerPhotoUri'; cameraType: 'back' | 'front'; guideType: 'wide' | 'closeup' | 'angle' }[] = [
  { field: 'harvestPhotoUri', cameraType: 'back', guideType: 'wide' },
  { field: 'weighmentPhotoUri', cameraType: 'back', guideType: 'closeup' },
  { field: 'farmerPhotoUri', cameraType: 'front', guideType: 'closeup' },
];

export default function FinalPhotosScreen() {
  const insets = useSafeAreaInsets();
  const { language, isVoiceOn } = useApp();
  const { recordId } = useLocalSearchParams<{ recordId: string }>();
  const [record, setRecord] = useState<FieldRecord | null>(null);
  const [step, setStep] = useState(0);
  const [guidanceVisible, setGuidanceVisible] = useState(false);
  const advancedRef = useRef<Record<number, boolean>>({});

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  useEffect(() => {
    if (recordId) getRecord(recordId).then(r => r && setRecord(r));
  }, []);

  const handleCapturePress = () => {
    setGuidanceVisible(true);
  };

  const capturePhoto = async () => {
    setGuidanceVisible(false);
    const { field, cameraType } = PHOTO_STEPS[step];
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        cameraType: cameraType === 'front' ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
      });
      if (!result.canceled && result.assets[0] && record) {
        const updated = { ...record, [field]: result.assets[0].uri };
        setRecord(updated);
        await saveRecord(updated);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert('Error', 'Could not open camera');
    }
  };

  useEffect(() => {
    if (!record) return;
    const { field } = PHOTO_STEPS[step];
    const uri = record[field];
    if (uri && !advancedRef.current[step]) {
      advancedRef.current[step] = true;
      const timer = setTimeout(() => {
        if (step < PHOTO_STEPS.length - 1) {
          setStep(step + 1);
        } else {
          router.push({ pathname: '/farmer-info', params: { recordId: record.id } });
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [record, step]);

  const titles = [t('harvestPhoto', language), t('weighmentPhoto', language), t('farmerPhoto', language)];

  useEffect(() => {
    if (isVoiceOn && titles[step]) {
      playVoiceInstruction(titles[step], language);
    }
    return () => {
      stopVoiceInstruction();
    };
  }, [step, isVoiceOn, language]);

  if (!record) return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><Text style={{ fontFamily: 'Nunito_400Regular', color: Colors.textSecondary }}>Loading...</Text></View>;

  const instructions = [t('fieldOverviewInstruction', language), t('cobCloseup', language), t('selfieInstruction', language)];
  const { field, guideType } = PHOTO_STEPS[step];
  const currentUri = record[field] as string | undefined;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => {
            if (step > 0) { setStep(step - 1); advancedRef.current[step - 1] = false; }
            else router.back();
          }} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('finalPhotos', language)}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ProgressBar current={step + 1} total={PHOTO_STEPS.length} />
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: bottomPad + 40 }}>
        <Animated.View
          key={`final-step-${step}`}
          entering={Platform.OS === 'web' ? FadeIn.duration(250) : SlideInRight.duration(300).springify().damping(20)}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.dot, currentUri ? styles.dotDone : {}]}>
              {currentUri ? <Ionicons name="checkmark" size={14} color={Colors.white} /> : <Text style={styles.dotText}>{step + 1}</Text>}
            </View>
            <Text style={styles.title}>{titles[step]}</Text>
          </View>
          {currentUri ? (
            <Animated.View entering={FadeIn.duration(400)} style={styles.photoWrap}>
              <Image source={{ uri: currentUri }} style={styles.photo} contentFit="contain" />
              <View style={styles.autoTag}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.white} />
                <Text style={styles.autoTagText}>Moving on...</Text>
              </View>
            </Animated.View>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.captureBtn, pressed && { opacity: 0.8 }]}
              onPress={handleCapturePress}
            >
              <Ionicons name="camera" size={32} color={Colors.primary} />
              <Text style={styles.captureBtnText}>{t('capture', language)}</Text>
            </Pressable>
          )}
        </Animated.View>
      </ScrollView>

      <PhotoGuidanceModal
        visible={guidanceVisible}
        onClose={() => setGuidanceVisible(false)}
        onCapture={capturePhoto}
        language={language}
        title={titles[step]}
        instruction={instructions[step]}
        type={guideType}
        exampleImage={
          step === 0 ? GuidanceImages.fieldOverview :
            step === 1 ? GuidanceImages.cobCloseup :
              GuidanceImages.selfie
        }
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
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
  dotDone: { backgroundColor: Colors.success },
  dotText: { fontSize: 13, fontFamily: 'Nunito_700Bold', color: Colors.textSecondary },
  title: { fontSize: 17, fontFamily: 'Nunito_700Bold', color: Colors.text },
  photoWrap: { borderRadius: 12, overflow: 'hidden', position: 'relative' },
  photo: { width: '100%', height: 220, borderRadius: 12, backgroundColor: Colors.surfaceAlt },
  captureBtn: { backgroundColor: Colors.surfaceAlt, borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 2, borderColor: Colors.borderLight, borderStyle: 'dashed', gap: 8 },
  captureBtnText: { fontSize: 15, fontFamily: 'Nunito_600SemiBold', color: Colors.primary },
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
  autoTagText: { fontSize: 11, fontFamily: 'Nunito_400Regular', color: Colors.white },
});
