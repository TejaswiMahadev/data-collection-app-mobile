import React, { useState } from 'react';
import { Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import Colors from '@/constants/colors';
import { Language } from '@/lib/i18n';

interface TTSButtonProps {
    text: string;
    language: Language;
    size?: number;
    color?: string;
}

export function TTSButton({ text, language, size = 20, color = Colors.primary }: TTSButtonProps) {
    const [speaking, setSpeaking] = useState(false);

    const speak = async () => {
        if (speaking) {
            Speech.stop();
            setSpeaking(false);
            return;
        }

        setSpeaking(true);
        const voiceLanguage = language === 'hi' ? 'hi-IN' : language === 'od' ? 'or-IN' : 'en-US';

        // Only speak the primary part (before the English parenthetical)
        const primaryText = text.split(' (')[0];

        Speech.speak(primaryText, {
            language: voiceLanguage,
            onDone: () => setSpeaking(false),
            onError: () => setSpeaking(false),
        });
    };

    return (
        <Pressable
            onPress={speak}
            style={({ pressed }) => [
                styles.btn,
                pressed && { opacity: 0.7 },
                speaking && styles.speaking
            ]}
        >
            {speaking ? (
                <Ionicons name="stop-circle" size={size} color={Colors.error} />
            ) : (
                <Ionicons name="volume-medium" size={size} color={color} />
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    btn: {
        padding: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    speaking: {
        backgroundColor: 'rgba(211, 47, 47, 0.1)',
    }
});
