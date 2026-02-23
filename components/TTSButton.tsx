import React, { useState, useRef, useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import Colors from '@/constants/colors';
import { Language } from '@/lib/i18n';
import { playVoiceInstruction } from '@/lib/tts';

interface TTSButtonProps {
    text: string;
    language: Language;
    size?: number;
    color?: string;
}

export function TTSButton({ text, language, size = 20, color = Colors.primary }: TTSButtonProps) {
    const [speaking, setSpeaking] = useState(false);
    const soundRef = useRef<Audio.Sound | null>(null);

    useEffect(() => {
        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
        };
    }, []);

    const speak = async () => {
        if (speaking) {
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }
            setSpeaking(false);
            return;
        }

        setSpeaking(true);

        const primaryText = text.split(' (')[0];

        const sound = await playVoiceInstruction(primaryText, language);
        if (sound) {
            soundRef.current = sound;
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setSpeaking(false);
                    sound.unloadAsync();
                    soundRef.current = null;
                }
            });
        } else {
            setSpeaking(false);
        }
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
