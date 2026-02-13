import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';
import { t } from '@/lib/i18n';
import { getRecord, saveRecord } from '@/lib/storage';
import { FieldRecord } from '@/lib/types';
import { ProgressBar } from '@/components/ProgressBar';

export default function PhotoWalkScreen() {
  const insets = useSafeAreaInsets();
  const { language } = useApp();
  const { recordId } = useLocalSearchParams<{ recordId: string }>();
  const [record, setRecord] = useState<FieldRecord | null>(null);
  const [phase, setPhase] = useState<'entry' | 'center' | 'zones'>('entry');

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  useEffect(() => {
    loadRecord();
  }, []);

  const loadRecord = async () => {
    if (recordId) {
      const r = await getRecord(recordId);
      if (r) setRecord(r);
    }
  };

  const takePhoto = async (type: 'entry' | 'center') => {
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
        } catch {}

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

  const goToZones = () => {
    if (record) {
      router.push({ pathname: '/zone-capture', params: { recordId: record.id } });
    }
  };

  if (!record) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const entryDone = !!record.entryPhotoUri;
  const centerDone = !!record.centerPhotoUri;
  const progress = (entryDone ? 1 : 0) + (centerDone ? 1 : 0);

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
        <ProgressBar current={progress} total={2} />
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: bottomPad + 100 }}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.stepDot, entryDone && styles.stepDotDone]}>
              {entryDone ? (
                <Ionicons name="checkmark" size={16} color={Colors.white} />
              ) : (
                <Text style={styles.stepDotText}>1</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{t('fieldOverview', language)}</Text>
              <Text style={styles.cardInstruction}>{t('fieldOverviewInstruction', language)}</Text>
            </View>
          </View>

          {record.entryPhotoUri ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: record.entryPhotoUri }} style={styles.previewImage} contentFit="cover" />
              <View style={styles.gpsTag}>
                <Ionicons name="location" size={12} color={Colors.white} />
                <Text style={styles.gpsTagText}>
                  {record.entryPhotoLat?.toFixed(4)}, {record.entryPhotoLng?.toFixed(4)}
                </Text>
              </View>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.captureBtn, pressed && { opacity: 0.8 }]}
              onPress={() => takePhoto('entry')}
            >
              <Ionicons name="camera" size={32} color={Colors.primary} />
              <Text style={styles.captureBtnText}>{t('capture', language)}</Text>
            </Pressable>
          )}
        </View>

        <View style={[styles.card, !entryDone && styles.cardLocked]}>
          <View style={styles.cardHeader}>
            <View style={[styles.stepDot, centerDone && styles.stepDotDone]}>
              {centerDone ? (
                <Ionicons name="checkmark" size={16} color={Colors.white} />
              ) : (
                <Text style={styles.stepDotText}>2</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{t('centerField', language)}</Text>
              <Text style={styles.cardInstruction}>{t('centerFieldInstruction', language)}</Text>
            </View>
          </View>

          {!entryDone ? (
            <View style={styles.lockedOverlay}>
              <Ionicons name="lock-closed" size={24} color={Colors.textLight} />
              <Text style={styles.lockedText}>Complete previous step</Text>
            </View>
          ) : record.centerPhotoUri ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: record.centerPhotoUri }} style={styles.previewImage} contentFit="cover" />
              <View style={styles.gpsTag}>
                <Ionicons name="location" size={12} color={Colors.white} />
                <Text style={styles.gpsTagText}>
                  {record.centerPhotoLat?.toFixed(4)}, {record.centerPhotoLng?.toFixed(4)}
                </Text>
              </View>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.captureBtn, pressed && { opacity: 0.8 }]}
              onPress={() => takePhoto('center')}
            >
              <Ionicons name="camera" size={32} color={Colors.primary} />
              <Text style={styles.captureBtnText}>{t('capture', language)}</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {entryDone && centerDone && (
        <View style={[styles.footer, { paddingBottom: bottomPad + 16 }]}>
          <Pressable
            style={({ pressed }) => [styles.nextBtn, pressed && { transform: [{ scale: 0.97 }] }]}
            onPress={goToZones}
          >
            <Text style={styles.nextBtnText}>{t('zoneIdentification', language)}</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
          </Pressable>
        </View>
      )}
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
  cardLocked: {
    opacity: 0.5,
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
  lockedOverlay: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  lockedText: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textLight,
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
  nextBtnText: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
    color: Colors.white,
  },
});
