import React, { useState, useEffect } from 'react';
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
import { FieldRecord } from '@/lib/types';

interface PhotoCardProps {
  title: string;
  uri?: string;
  onCapture: () => void;
}

function PhotoCard({ title, uri, onCapture }: PhotoCardProps) {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.header}>
        <View style={[cardStyles.dot, uri ? cardStyles.dotDone : {}]}>
          {uri ? <Ionicons name="checkmark" size={14} color={Colors.white} /> : null}
        </View>
        <Text style={cardStyles.title}>{title}</Text>
      </View>
      {uri ? (
        <View style={cardStyles.photoWrap}>
          <Image source={{ uri }} style={cardStyles.photo} contentFit="cover" />
          <Pressable style={cardStyles.retakeBtn} onPress={onCapture}>
            <Ionicons name="refresh" size={16} color={Colors.white} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [cardStyles.captureBtn, pressed && { opacity: 0.8 }]}
          onPress={onCapture}
        >
          <Ionicons name="camera" size={28} color={Colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  dot: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
  dotDone: { backgroundColor: Colors.success },
  title: { fontSize: 16, fontFamily: 'Nunito_600SemiBold', color: Colors.text },
  photoWrap: { borderRadius: 12, overflow: 'hidden', position: 'relative' },
  photo: { width: '100%', height: 180, borderRadius: 12 },
  retakeBtn: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  captureBtn: { backgroundColor: Colors.surfaceAlt, borderRadius: 12, padding: 28, alignItems: 'center', borderWidth: 2, borderColor: Colors.borderLight, borderStyle: 'dashed' },
});

export default function FinalPhotosScreen() {
  const insets = useSafeAreaInsets();
  const { language } = useApp();
  const { recordId } = useLocalSearchParams<{ recordId: string }>();
  const [record, setRecord] = useState<FieldRecord | null>(null);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  useEffect(() => {
    if (recordId) getRecord(recordId).then(r => r && setRecord(r));
  }, []);

  const capturePhoto = async (field: 'harvestPhotoUri' | 'weighmentPhotoUri' | 'farmerPhotoUri') => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        cameraType: field === 'farmerPhotoUri' ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
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

  if (!record) return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><Text style={{ fontFamily: 'Nunito_400Regular', color: Colors.textSecondary }}>Loading...</Text></View>;

  const allDone = !!record.harvestPhotoUri && !!record.weighmentPhotoUri;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('finalPhotos', language)}</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: bottomPad + 100 }}>
        <PhotoCard title={t('harvestPhoto', language)} uri={record.harvestPhotoUri} onCapture={() => capturePhoto('harvestPhotoUri')} />
        <PhotoCard title={t('weighmentPhoto', language)} uri={record.weighmentPhotoUri} onCapture={() => capturePhoto('weighmentPhotoUri')} />
        <PhotoCard title={t('farmerPhoto', language)} uri={record.farmerPhotoUri || undefined} onCapture={() => capturePhoto('farmerPhotoUri')} />
      </ScrollView>

      {allDone && (
        <View style={[styles.footer, { paddingBottom: bottomPad + 16 }]}>
          <Pressable
            style={({ pressed }) => [styles.nextBtn, pressed && { transform: [{ scale: 0.97 }] }]}
            onPress={() => router.push({ pathname: '/farmer-info', params: { recordId: record.id } })}
          >
            <Text style={styles.nextBtnText}>{t('farmerInfo', language)}</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Nunito_700Bold', color: Colors.white },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, gap: 8 },
  nextBtnText: { fontSize: 17, fontFamily: 'Nunito_700Bold', color: Colors.white },
});
