import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';
import { t, Language } from '@/lib/i18n';

interface PhotoGuidanceModalProps {
    visible: boolean;
    onClose: () => void;
    onCapture: () => void;
    language: Language;
    title: string;
    instruction: string;
    type: 'wide' | 'closeup' | 'angle';
    exampleImage?: any;
}

export function PhotoGuidanceModal({
    visible,
    onClose,
    onCapture,
    language,
    title,
    instruction,
    type,
    exampleImage
}: PhotoGuidanceModalProps) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <Pressable onPress={onClose}>
                            <Ionicons name="close" size={24} color={Colors.textLight} />
                        </Pressable>
                    </View>

                    <View style={styles.guideContainer}>
                        {/* Visual Representation */}
                        <View style={styles.visualBox}>
                            {exampleImage ? (
                                <Image
                                    source={exampleImage}
                                    style={styles.exampleImg}
                                    contentFit="contain"
                                />
                            ) : (
                                <Ionicons
                                    name={type === 'wide' ? 'image-outline' : type === 'closeup' ? 'scan-outline' : 'camera-outline'}
                                    size={80}
                                    color={Colors.primary}
                                />
                            )}
                            <View style={styles.angleIndicator}>
                                <Ionicons
                                    name="camera"
                                    size={18}
                                    color={Colors.primary}
                                />
                                <Text style={styles.exampleBadge}>EXAMPLE</Text>
                            </View>
                        </View>

                        <View style={styles.instructionBox}>
                            <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
                            <Text style={styles.instructionText}>{instruction}</Text>
                        </View>

                        <View style={styles.tipBox}>
                            <Text style={styles.tipTitle}>Quick Tips:</Text>
                            <Text style={styles.tipText}>• Keep the phone steady</Text>
                            <Text style={styles.tipText}>• Ensure bright natural light</Text>
                            <Text style={styles.tipText}>• Avoid shadows on the subject</Text>
                        </View>
                    </View>

                    <Pressable style={styles.captureBtn} onPress={onCapture}>
                        <Ionicons name="camera" size={22} color={Colors.white} />
                        <Text style={styles.captureBtnText}>{t('capture', language)}</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        backgroundColor: Colors.surface,
        borderRadius: 24,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontFamily: 'Nunito_700Bold',
        color: Colors.text,
    },
    guideContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    visualBox: {
        width: '100%',
        height: 180,
        backgroundColor: Colors.surfaceAlt,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        position: 'relative',
    },
    angleIndicator: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: Colors.white,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        elevation: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    exampleBadge: {
        fontSize: 10,
        fontFamily: 'Nunito_700Bold',
        color: Colors.primary,
    },
    exampleImg: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },
    instructionBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceAlt,
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        gap: 8,
    },
    instructionText: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'Nunito_600SemiBold',
        color: Colors.text,
        lineHeight: 20,
    },
    tipBox: {
        width: '100%',
        paddingHorizontal: 4,
    },
    tipTitle: {
        fontSize: 13,
        fontFamily: 'Nunito_700Bold',
        color: Colors.textSecondary,
        marginBottom: 6,
    },
    tipText: {
        fontSize: 13,
        fontFamily: 'Nunito_400Regular',
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    captureBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 14,
        gap: 8,
    },
    captureBtnText: {
        fontSize: 16,
        fontFamily: 'Nunito_700Bold',
        color: Colors.white,
    },
});
