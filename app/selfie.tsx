import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';
import { t } from '@/lib/i18n';
import { playVoiceInstruction } from '@/lib/tts';

export default function SelfieScreen() {
  const insets = useSafeAreaInsets();
  const { language, setSelfieUri, isVoiceOn } = useApp();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  React.useEffect(() => {
    if (isVoiceOn) {
      playVoiceInstruction(t('viSelfie' as any, language), language);
    }
  }, [isVoiceOn, language]);

  const takePhoto = async () => {
    setCapturing(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        cameraType: ImagePicker.CameraType.front,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open camera');
    }
    setCapturing(false);
  };

  const confirmPhoto = () => {
    if (photoUri) {
      setSelfieUri(photoUri);
      router.replace('/dashboard');
    }
  };

  return (
    <LinearGradient
      colors={[Colors.primaryDark, Colors.primary]}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) + 40 }]}>
        <Text style={styles.title}>{t('takeSelfie', language)}</Text>
        <Text style={styles.subtitle}>{t('selfieInstruction', language)}</Text>

        <View style={styles.photoContainer}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="person" size={64} color="rgba(255,255,255,0.4)" />
            </View>
          )}
          <View style={styles.circleOverlay} />
        </View>

        {!photoUri ? (
          <Pressable
            style={({ pressed }) => [styles.captureBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }]}
            onPress={takePhoto}
            disabled={capturing}
          >
            <Ionicons name="camera" size={28} color={Colors.primaryDark} />
            <Text style={styles.captureBtnText}>{t('capture', language)}</Text>
          </Pressable>
        ) : (
          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [styles.retakeBtn, pressed && { opacity: 0.8 }]}
              onPress={() => setPhotoUri(null)}
            >
              <Ionicons name="refresh" size={22} color={Colors.white} />
              <Text style={styles.retakeBtnText}>{t('retake', language)}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }]}
              onPress={confirmPhoto}
            >
              <Ionicons name="checkmark" size={22} color={Colors.primaryDark} />
              <Text style={styles.confirmBtnText}>{t('confirm', language)}</Text>
            </Pressable>
          </View>
        )}
      </View>
      <View style={{ height: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 20 }} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
    color: Colors.white,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  photoContainer: {
    width: 220,
    height: 220,
    borderRadius: 110,
    overflow: 'hidden',
    marginBottom: 40,
    position: 'relative',
  },
  photo: {
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  placeholder: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 110,
    borderWidth: 4,
    borderColor: Colors.accent,
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 10,
  },
  captureBtnText: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: Colors.primaryDark,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
  },
  retakeBtnText: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.white,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
  },
  confirmBtnText: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: Colors.primaryDark,
  },
});
