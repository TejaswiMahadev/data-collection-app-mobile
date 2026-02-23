import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Platform, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';
import { t } from '@/lib/i18n';
import { getAllRecords, deleteRecord } from '@/lib/storage';
import { FieldRecord } from '@/lib/types';
import { playVoiceInstruction, stopVoiceInstruction } from '@/lib/tts';

function RecordItem({ record, language, onDelete }: { record: FieldRecord; language: string; onDelete: () => void }) {
  const zonesCompleted = record.zones.filter(z => z.completed).length;
  const syncColor = record.syncStatus === 'synced' ? Colors.success : record.syncStatus === 'failed' ? Colors.error : Colors.accent;
  const syncLabel = record.syncStatus === 'synced' ? t('synced', language as any) : record.syncStatus === 'failed' ? t('failed', language as any) : t('pending', language as any);
  const date = new Date(record.createdAt).toLocaleDateString();

  return (
    <Pressable
      style={({ pressed }) => [styles.recordCard, pressed && { transform: [{ scale: 0.98 }] }]}
      onPress={() => router.push({ pathname: '/review', params: { recordId: record.id } })}
      onLongPress={() => {
        Alert.alert(
          t('delete', language as any),
          `${t('fieldId', language as any)}: ${record.fieldId}`,
          [
            { text: t('no', language as any), style: 'cancel' },
            { text: t('yes', language as any), style: 'destructive', onPress: onDelete },
          ]
        );
      }}
    >
      <View style={styles.recordRow}>
        <View style={styles.recordIcon}>
          <Ionicons name="document-text" size={24} color={Colors.primary} />
        </View>
        <View style={styles.recordInfo}>
          <Text style={styles.recordId}>{record.fieldId || 'No Field ID'}</Text>
          <Text style={styles.recordMeta}>
            {record.district ? `${record.district}, ` : ''}{record.village || ''} {'\u2022'} {date}
          </Text>
          <View style={styles.recordTags}>
            <View style={[styles.tag, { backgroundColor: syncColor + '15' }]}>
              <View style={[styles.tagDot, { backgroundColor: syncColor }]} />
              <Text style={[styles.tagText, { color: syncColor }]}>{syncLabel}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: Colors.surfaceAlt }]}>
              <Text style={styles.tagText}>Zones: {zonesCompleted}/3</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
      </View>
    </Pressable>
  );
}

export default function RecordsScreen() {
  const insets = useSafeAreaInsets();
  const { language, isVoiceOn } = useApp();
  const [records, setRecords] = useState<FieldRecord[]>([]);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  const loadRecords = async () => {
    const data = await getAllRecords();
    setRecords(data.sort((a, b) => b.createdAt - a.createdAt));
  };

  useFocusEffect(
    useCallback(() => {
      loadRecords();
      if (isVoiceOn) {
        playVoiceInstruction(t('viRecords' as any, language), language);
      }
      return () => {
        stopVoiceInstruction();
      };
    }, [isVoiceOn, language])
  );

  const handleDelete = async (id: string) => {
    await deleteRecord(id);
    loadRecords();
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('myRecords', language)}</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerCount}>{records.length} records</Text>
      </LinearGradient>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecordItem record={item} language={language} onDelete={() => handleDelete(item.id)} />
        )}
        contentContainerStyle={{ padding: 20, paddingBottom: bottomPad + 20 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>{t('noRecords', language)}</Text>
          </View>
        }
        scrollEnabled={records.length > 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Nunito_700Bold', color: Colors.white },
  headerCount: { fontSize: 14, fontFamily: 'Nunito_400Regular', color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  recordCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  recordRow: { flexDirection: 'row', alignItems: 'center' },
  recordIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  recordInfo: { flex: 1 },
  recordId: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: Colors.text },
  recordMeta: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: Colors.textSecondary, marginTop: 2 },
  recordTags: { flexDirection: 'row', gap: 8, marginTop: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 4 },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagText: { fontSize: 12, fontFamily: 'Nunito_600SemiBold', color: Colors.textSecondary },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, fontFamily: 'Nunito_400Regular', color: Colors.textLight },
});
