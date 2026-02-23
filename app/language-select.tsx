import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';
import { Language, languageNames } from '@/lib/i18n';

const { width } = Dimensions.get('window');
const LANGUAGES: Language[] = ['en', 'hi', 'od'];

export default function LanguageSelectScreen() {
    const insets = useSafeAreaInsets();
    const { changeLanguage, language: currentLang, isVoicePrefSet } = useApp();

    const handleSelect = (lang: Language) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        changeLanguage(lang);

        setTimeout(() => {
            if (!isVoicePrefSet) {
                router.replace('/voice-prompt');
            } else {
                router.replace('/selfie');
            }
        }, 400);
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.primaryDark, Colors.primary, '#43A047']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.headerContent}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="language" size={40} color={Colors.white} />
                    </View>
                    <Text style={styles.title}>Choose Your Language</Text>
                    <Text style={styles.subtitle}>अपनी भाषा चुनें | ଆପଣଙ୍କ ଭାଷା ବାଛନ୍ତୁ</Text>
                </Animated.View>
            </LinearGradient>

            <View style={styles.body}>
                <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.langList}>
                    {LANGUAGES.map((lang, index) => (
                        <Pressable
                            key={lang}
                            onPress={() => handleSelect(lang)}
                            style={({ pressed }) => [
                                styles.langCard,
                                pressed && { transform: [{ scale: 0.98 }] },
                                currentLang === lang && styles.langCardActive
                            ]}
                        >
                            <View style={styles.langInfo}>
                                <Text style={styles.langNative}>
                                    {lang === 'en' ? 'English' : lang === 'hi' ? 'हिन्दी' : 'ଓଡ଼ିଆ'}
                                </Text>
                                <Text style={styles.langName}>{languageNames[lang]}</Text>
                            </View>
                            <View style={[styles.radio, currentLang === lang && styles.radioActive]}>
                                {currentLang === lang && <View style={styles.radioInner} />}
                            </View>
                        </Pressable>
                    ))}
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(1000)} style={styles.footer}>
                    <Text style={styles.footerText}>
                        You can change this anytime in Settings
                    </Text>
                </Animated.View>
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
        height: '40%',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    headerContent: {
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontFamily: 'Nunito_800ExtraBold',
        color: Colors.white,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Nunito_400Regular',
        color: 'rgba(255,255,255,0.8)',
        marginTop: 10,
        textAlign: 'center',
    },
    body: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 30,
        marginTop: -40,
    },
    langList: {
        gap: 16,
    },
    langCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.surface,
        padding: 24,
        borderRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    langCardActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '05',
    },
    langInfo: {
        flex: 1,
    },
    langNative: {
        fontSize: 20,
        fontFamily: 'Nunito_700Bold',
        color: Colors.text,
    },
    langName: {
        fontSize: 14,
        fontFamily: 'Nunito_400Regular',
        color: Colors.textSecondary,
        marginTop: 2,
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.borderLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioActive: {
        borderColor: Colors.primary,
    },
    radioInner: {
        width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary
    },
    footer: {
        marginTop: 'auto',
        paddingBottom: 40,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        fontFamily: 'Nunito_400Regular',
        color: Colors.textLight,
    },
});
