import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';
import { t, Language, languageNames } from '@/lib/i18n';
import { playVoiceInstruction } from '@/lib/tts';

const LANGUAGES: Language[] = ['en', 'hi', 'od'];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { language, changeLanguage, isVoiceOn } = useApp();

  React.useEffect(() => {
    if (isVoiceOn) {
      playVoiceInstruction(t('viSettings' as any, language), language);
    }
  }, [isVoiceOn, language]);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('settings', language)}</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <View style={[styles.body, { paddingBottom: bottomPad + 20 }]}>
        <Text style={styles.sectionTitle}>{t('language', language)}</Text>

        {LANGUAGES.map((lang) => (
          <Pressable
            key={lang}
            style={({ pressed }) => [
              styles.langOption,
              language === lang && styles.langOptionActive,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => {
              changeLanguage(lang);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={styles.langRow}>
              <View style={[styles.radio, language === lang && styles.radioActive]}>
                {language === lang && <View style={styles.radioInner} />}
              </View>
              <View>
                <Text style={[styles.langName, language === lang && styles.langNameActive]}>
                  {languageNames[lang]}
                </Text>
                <Text style={styles.langNative}>
                  {lang === 'en' ? 'English' : lang === 'hi' ? '\u0939\u093F\u0928\u094D\u0926\u0940' : '\u0B13\u0B21\u0B3C\u0B3F\u0B06'}
                </Text>
              </View>
            </View>
            {language === lang && (
              <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
            )}
          </Pressable>
        ))}

        <View style={styles.aboutCard}>
          <View style={styles.aboutIcon}>
            <Ionicons name="leaf" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.aboutTitle}>{t('appName', language)}</Text>
          <Text style={styles.aboutSub}>{t('tagline', language)}</Text>
          <Text style={styles.version}>v1.0.0</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Nunito_700Bold', color: Colors.white },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 28 },
  sectionTitle: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: Colors.textSecondary, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 16 },
  langOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: 14, padding: 18, marginBottom: 10, borderWidth: 2, borderColor: Colors.borderLight },
  langOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  langRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: Colors.primary },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },
  langName: { fontSize: 16, fontFamily: 'Nunito_600SemiBold', color: Colors.text },
  langNameActive: { color: Colors.primary },
  langNative: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: Colors.textSecondary, marginTop: 2 },
  aboutCard: { alignItems: 'center', marginTop: 40, padding: 24 },
  aboutIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: Colors.surfaceAlt, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  aboutTitle: { fontSize: 22, fontFamily: 'Nunito_800ExtraBold', color: Colors.text },
  aboutSub: { fontSize: 14, fontFamily: 'Nunito_400Regular', color: Colors.textSecondary, marginTop: 4 },
  version: { fontSize: 12, fontFamily: 'Nunito_400Regular', color: Colors.textLight, marginTop: 8 },
});
