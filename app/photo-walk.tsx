import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';
import { t } from '@/lib/i18n';
import { getRecord, saveRecord } from '@/lib/storage';
import { FieldRecord } from '@/lib/types';
import { playVoiceInstruction } from '@/lib/tts';
import { ProgressBar } from '@/components/ProgressBar';
import { PhotoGuidanceModal } from '@/components/PhotoGuidanceModal';
import { GuidanceImages } from '@/constants/assets';

export default function PhotoWalkScreen() {
  const insets = useSafeAreaInsets();
  const { language, isVoiceOn } = useApp();
  const { recordId } = useLocalSearchParams<{ recordId: string }>();
  const [record, setRecord] = useState<FieldRecord | null>(null);
  const [step, setStep] = useState(0);
  const [guidanceVisible, setGuidanceVisible] = useState(false);
  const [currentType, setCurrentType] = useState<'entry' | 'center'>('entry');
  const advancedRef = useRef<Record<string, boolean>>({});

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  useEffect(() => {
    loadRecord();
    if (isVoiceOn) {
      playVoiceInstruction(t('viPhotoWalk' as any, language), language);
    }
  }, [isVoiceOn, language]);

  const loadRecord = async () => {
    if (recordId) {
      const r = await getRecord(recordId);
      if (r) setRecord(r);
    }
  };

  const handleCapturePress = (type: 'entry' | 'center') => {
    setCurrentType(type);
    setGuidanceVisible(true);
  };

  const takePhoto = async () => {
    setGuidanceVisible(false);
    const type = currentType;
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0] && record) {
        let lat: number | undefined;
        let lng: number | undefined;
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
        } catch { }

        const updated = { ...record };
        if (type === 'entry') {
          updated.entryPhotoUri = result.assets[0].uri;
          updated.entryPhotoLat = lat;
          updated.entryPhotoLng = lng;
        } else {
          updated.centerPhotoUri = result.assets[0].uri;
          updated.centerPhotoLat = lat;
          updated.centerPhotoLng = lng;
        }
        setRecord(updated);
        await saveRecord(updated);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open camera');
    }
  };

  useEffect(() => {
    if (!record) return;
    if (step === 0 && record.entryPhotoUri && !advancedRef.current['entry']) {
      advancedRef.current['entry'] = true;
      const timer = setTimeout(() => setStep(1), 600);
      return () => clearTimeout(timer);
    }
    if (step === 1 && record.centerPhotoUri && !advancedRef.current['center']) {
      advancedRef.current['center'] = true;
      const timer = setTimeout(() => {
        router.push({ pathname: '/zone-capture', params: { recordId: record.id } });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [record, step]);

  if (!record) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const entryDone = !!record.entryPhotoUri;
  const centerDone = !!record.centerPhotoUri;

  const renderPhotoStep = (type: 'entry' | 'center', title: string, instruction: string, uri?: string, lat?: number, lng?: number) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.stepDot, uri ? styles.stepDotDone : {}]}>
          {uri ? <Ionicons name="checkmark" size={16} color={Colors.white} /> : <Text style={styles.stepDotText}>{type === 'entry' ? '1' : '2'}</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardInstruction}>{instruction}</Text>
        </View>
      </View>

      {uri ? (
        <Animated.View entering={FadeIn.duration(400)} style={styles.photoPreview}>
          <Image source={{ uri }} style={styles.previewImage} contentFit="contain" />
          <View style={styles.gpsTag}>
            <Ionicons name="location" size={12} color={Colors.white} />
            <Text style={styles.gpsTagText}>
              {lat?.toFixed(4)}, {lng?.toFixed(4)}
            </Text>
          </View>
          <View style={styles.autoTag}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.white} />
            <Text style={styles.autoTagText}>Moving on...</Text>
          </View>
        </Animated.View>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.captureBtn, pressed && { opacity: 0.8 }]}
          onPress={() => handleCapturePress(type)}
        >
          <Ionicons name="camera" size={32} color={Colors.primary} />
          <Text style={styles.captureBtnText}>{t('capture', language)}</Text>
        </Pressable>
      )}
    </View>
  );

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
          <Text style={styles.headerTitle}>{t('fieldOverview', language)}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ProgressBar current={step + 1} total={2} />
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: bottomPad + 40 }}>
        <Animated.View
          key={`photo-step-${step}`}
          entering={Platform.OS === 'web' ? FadeIn.duration(250) : SlideInRight.duration(300).springify().damping(20)}
        >
          {step === 0 && renderPhotoStep('entry', t('fieldOverview', language), t('fieldOverviewInstruction', language), record.entryPhotoUri, record.entryPhotoLat, record.entryPhotoLng)}
          {step === 1 && renderPhotoStep('center', t('centerField', language), t('centerFieldInstruction', language), record.centerPhotoUri, record.centerPhotoLat, record.centerPhotoLng)}
        </Animated.View>
      </ScrollView>

      <PhotoGuidanceModal
        visible={guidanceVisible}
        onClose={() => setGuidanceVisible(false)}
        onCapture={takePhoto}
        language={language}
        title={currentType === 'entry' ? t('fieldOverview', language) : t('centerField', language)}
        instruction={currentType === 'entry' ? t('fieldOverviewInstruction', language) : t('centerFieldInstruction', language)}
        type={currentType === 'entry' ? 'wide' : 'angle'}
        exampleImage={currentType === 'entry' ? GuidanceImages.fieldOverview : GuidanceImages.fieldAngle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textSecondary,
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
    gap: 12,
    marginBottom: 16,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepDotDone: {
    backgroundColor: Colors.success,
  },
  stepDotText: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textSecondary,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
  },
  cardInstruction: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
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
  photoPreview: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
  },
  gpsTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  gpsTagText: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    color: Colors.white,
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
