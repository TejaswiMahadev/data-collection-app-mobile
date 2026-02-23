import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';
import { t } from '@/lib/i18n';

export default function VoicePromptScreen() {
    const insets = useSafeAreaInsets();
    const { language, toggleVoice } = useApp();
    const [selected, setSelected] = useState<boolean | null>(null);

    const topPad = insets.top + (Platform.OS === 'web' ? 40 : 20);
    const bottomPad = insets.bottom + 20;

    const handleSelection = async (enable: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelected(enable);

        // Set the state in context
        toggleVoice(enable);

        // Save to storage
        const { setVoicePreference } = await import('@/lib/storage');
        await setVoicePreference(enable ? 'yes' : 'no');

        setTimeout(() => {
            // Navigate to selfie if not set, otherwise dashboard
            const { getSelfie } = require('@/lib/storage');
            getSelfie().then((uri: any) => {
                if (uri) {
                    router.replace('/dashboard');
                } else {
                    router.replace('/selfie');
                }
            });
        }, 400);
    };

    return (
        <LinearGradient
            colors={[Colors.background, '#f8fbf8']}
            style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}
        >
            <View style={styles.content}>
                <Animated.View entering={FadeInUp.duration(600).springify()} style={styles.iconWrap}>
                    <Ionicons name="volume-high" size={48} color={Colors.primary} />
                </Animated.View>

                <Animated.Text entering={FadeInUp.duration(600).delay(100).springify()} style={styles.title}>
                    Voice Instructions
                </Animated.Text>

                <Animated.Text entering={FadeInUp.duration(600).delay(200).springify()} style={styles.subtitle}>
                    Do you want the app to read instructions to you out loud as you navigate?
                </Animated.Text>

                <Animated.View entering={FadeInDown.duration(600).delay(300).springify()} style={styles.btnRow}>
                    <Pressable
                        style={[
                            styles.btn,
                            styles.btnYes,
                            selected === true && styles.btnSelectedYes
                        ]}
                        onPress={() => handleSelection(true)}
                    >
                        <Ionicons name="checkmark-circle" size={24} color={selected === true ? Colors.white : Colors.success} />
                        <Text style={[styles.btnText, selected === true && { color: Colors.white }]}>
                            Yes, Enable Voice
                        </Text>
                    </Pressable>

                    <Pressable
                        style={[
                            styles.btn,
                            styles.btnNo,
                            selected === false && styles.btnSelectedNo
                        ]}
                        onPress={() => handleSelection(false)}
                    >
                        <Ionicons name="close-circle" size={24} color={selected === false ? Colors.white : Colors.error} />
                        <Text style={[styles.btnText, { color: Colors.textSecondary }, selected === false && { color: Colors.white }]}>
                            No, I'll read them
                        </Text>
                    </Pressable>
                </Animated.View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconWrap: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: Colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 26,
        fontFamily: 'Nunito_800ExtraBold',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Nunito_400Regular',
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 48,
    },
    btnRow: {
        width: '100%',
        gap: 16,
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 20,
        gap: 12,
        borderWidth: 2,
        backgroundColor: Colors.white,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    btnYes: {
        borderColor: Colors.success + '40',
    },
    btnNo: {
        borderColor: Colors.borderLight,
        borderWidth: 1,
        elevation: 0,
        shadowOpacity: 0,
    },
    btnSelectedYes: {
        backgroundColor: Colors.success,
        borderColor: Colors.success,
    },
    btnSelectedNo: {
        backgroundColor: Colors.textLight,
        borderColor: Colors.textLight,
    },
    btnText: {
        fontSize: 18,
        fontFamily: 'Nunito_700Bold',
        color: Colors.success,
    },
});
