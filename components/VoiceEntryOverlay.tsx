import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    interpolate,
    FadeIn,
    SlideInDown
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useVoiceInput } from '@/lib/hooks/useVoiceInput';
import { parseSpeechToFields } from '@/lib/nlp';
import { Language, t } from '@/lib/i18n';
import { FieldRecord } from '@/lib/types';

interface VoiceEntryOverlayProps {
    visible: boolean;
    onClose: () => void;
    onApply: (fields: Partial<FieldRecord>) => void;
    language: Language;
}

export function VoiceEntryOverlay({ visible, onClose, onApply, language }: VoiceEntryOverlayProps) {
    const { isListening, transcript, isComplete, startListening, stopListening } = useVoiceInput();
    const [localFields, setLocalFields] = useState<Record<string, string>>({});
    const pulse = useSharedValue(1);

    useEffect(() => {
        if (visible && !isListening) {
            const bcpLanguage = language === 'hi' ? 'hi-IN' : language === 'od' ? 'or-IN' : 'en-US';
            startListening(bcpLanguage);
        }
    }, [visible]);

    useEffect(() => {
        if (isListening) {
            pulse.value = withRepeat(withTiming(1.2, { duration: 1000 }), -1, true);
        } else {
            pulse.value = withTiming(1);
        }
    }, [isListening]);

    const lastAppliedRef = useRef<string>('');

    const parsedFields = useMemo(() => {
        return parseSpeechToFields(transcript, language);
    }, [transcript, language]);

    useEffect(() => {
        if (transcript && transcript !== lastAppliedRef.current) {
            const { zoneUpdates, ...mainFields } = parsedFields;
            // Only apply if we have detected something
            if (Object.keys(mainFields).length > 0) {
                const fields: Record<string, string> = {};
                Object.entries(mainFields).forEach(([k, v]) => {
                    if (typeof v !== 'object') fields[k] = String(v);
                });

                // Pushing to local state for UI display
                setLocalFields(prev => ({ ...prev, ...fields }));

                // Real-time update to parent screen
                onApply(fields as Partial<FieldRecord>);

                lastAppliedRef.current = transcript;
            }
        }
    }, [transcript, parsedFields]);

    useEffect(() => {
        if (visible && !isListening) {
            setLocalFields({});
            lastAppliedRef.current = '';
        }
    }, [visible]);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
        opacity: interpolate(pulse.value, [1, 1.2], [0.5, 0.2]),
    }));

    const handleApply = () => {
        onApply(localFields as Partial<FieldRecord>);
        onClose();
    };

    const updateField = (key: string, val: string) => {
        setLocalFields(prev => ({ ...prev, [key]: val }));
    };

    const removeField = (key: string) => {
        const next = { ...localFields };
        delete next[key];
        setLocalFields(next);
    };

    const addField = () => {
        setLocalFields(prev => ({ ...prev, '': '' }));
    };

    const detectedFieldsCount = Object.keys(localFields).length;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <Animated.View entering={SlideInDown.springify()} style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{t('voiceEntry', language)}</Text>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={Colors.textLight} />
                        </Pressable>
                    </View>

                    <View style={styles.micContainer}>
                        {isListening && <Animated.View style={[styles.pulse, pulseStyle]} />}
                        <Pressable
                            onPress={isListening ? stopListening : () => startListening(language === 'hi' ? 'hi-IN' : language === 'od' ? 'or-IN' : 'en-US')}
                            style={[styles.micBtn, isListening && styles.micBtnActive]}
                        >
                            <Ionicons name={isListening ? "mic" : "mic-outline"} size={40} color={Colors.white} />
                        </Pressable>
                        <Text style={styles.statusText}>
                            {isListening ? t('listening', language) : t('tapToSpeak', language)}
                        </Text>
                    </View>

                    <View style={styles.transcriptBox}>
                        <ScrollView style={styles.scroll}>
                            <Text style={styles.transcriptText}>
                                {transcript || (language === 'hi' ? "बोलना शुरू करें..." : language === 'od' ? "କହିବା ଆରମ୍ଭ କରନ୍ତୁ..." : "Start speaking...")}
                            </Text>
                        </ScrollView>
                        {isListening && (
                            <View style={styles.listeningIndicator}>
                                <View style={styles.dot} />
                                <View style={[styles.dot, { opacity: 0.6 }]} />
                                <View style={[styles.dot, { opacity: 0.3 }]} />
                            </View>
                        )}
                    </View>

                    {(detectedFieldsCount > 0 || (isComplete && transcript)) && (
                        <View style={styles.detectedBox}>
                            <View style={styles.detectedHeader}>
                                <Ionicons name={detectedFieldsCount > 0 ? "checkmark-circle" : "alert-circle"} size={16} color={detectedFieldsCount > 0 ? Colors.success : Colors.warning} />
                                <Text style={[styles.detectedTitle, detectedFieldsCount === 0 && { color: Colors.warning }]}>
                                    {detectedFieldsCount > 0 ? `${detectedFieldsCount} ${t('fieldsDetected', language)}` : t('noFieldsDetected', language)}
                                </Text>
                                <Pressable onPress={addField} style={styles.addBtn}>
                                    <Ionicons name="add" size={18} color={Colors.primary} />
                                </Pressable>
                            </View>
                            <View style={styles.fieldsList}>
                                {Object.entries(localFields).map(([key, val], idx) => {
                                    return (
                                        <View key={`${idx}-${key}`} style={styles.fieldItem}>
                                            <TextInput
                                                style={styles.fieldKeyInput}
                                                value={key}
                                                placeholder="Field"
                                                onChangeText={(newKey) => {
                                                    const next = { ...localFields };
                                                    delete next[key];
                                                    next[newKey] = val;
                                                    setLocalFields(next);
                                                }}
                                            />
                                            <Text style={styles.sep}>:</Text>
                                            <TextInput
                                                style={styles.fieldValInput}
                                                value={val}
                                                placeholder="Value"
                                                onChangeText={(newVal) => updateField(key, newVal)}
                                            />
                                            <Pressable onPress={() => removeField(key)} style={styles.removeBtn}>
                                                <Ionicons name="close-circle" size={16} color={Colors.error} />
                                            </Pressable>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    <Pressable
                        style={[styles.applyBtn, (detectedFieldsCount === 0) && styles.applyBtnDisabled]}
                        disabled={detectedFieldsCount === 0}
                        onPress={handleApply}
                    >
                        <Text style={styles.applyBtnText}>{t('applyToFields', language)}</Text>
                    </Pressable>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        minHeight: '60%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontFamily: 'Nunito_700Bold',
        color: Colors.text,
    },
    closeBtn: {
        padding: 4,
    },
    micContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    micBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    micBtnActive: {
        backgroundColor: Colors.error,
    },
    pulse: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary,
    },
    statusText: {
        marginTop: 12,
        fontSize: 16,
        fontFamily: 'Nunito_600SemiBold',
        color: Colors.textSecondary,
    },
    transcriptBox: {
        backgroundColor: Colors.surfaceAlt,
        borderRadius: 16,
        padding: 16,
        height: 120,
        marginBottom: 24,
        position: 'relative',
    },
    listeningIndicator: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        flexDirection: 'row',
        gap: 4,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.primary,
    },
    scroll: {
        flex: 1,
    },
    transcriptText: {
        fontSize: 17,
        fontFamily: 'Nunito_400Regular',
        color: Colors.text,
        lineHeight: 24,
    },
    detectedBox: {
        backgroundColor: '#E8F5E9',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    detectedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    detectedTitle: {
        fontSize: 15,
        fontFamily: 'Nunito_700Bold',
        color: Colors.success,
    },
    fieldsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    fieldItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(56, 142, 60, 0.2)',
        marginBottom: 8,
        width: '100%',
    },
    fieldKeyInput: {
        fontSize: 12,
        fontFamily: 'Nunito_700Bold',
        color: Colors.textSecondary,
        minWidth: 60,
        padding: 0,
    },
    sep: {
        fontSize: 12,
        fontFamily: 'Nunito_700Bold',
        color: Colors.textSecondary,
        marginHorizontal: 4,
    },
    fieldValInput: {
        flex: 1,
        fontSize: 12,
        fontFamily: 'Nunito_600SemiBold',
        color: Colors.primary,
        padding: 0,
    },
    removeBtn: {
        padding: 4,
    },
    addBtn: {
        marginLeft: 'auto',
        padding: 4,
    },
    applyBtn: {
        backgroundColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
    },
    applyBtnDisabled: {
        backgroundColor: Colors.textLight,
    },
    applyBtnText: {
        fontSize: 17,
        fontFamily: 'Nunito_700Bold',
        color: Colors.white,
    },
});
