import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';
import { t } from '@/lib/i18n';
import { getRecord, saveRecord } from '@/lib/storage';
import { FieldRecord } from '@/lib/types';

interface SummaryCardProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  color?: string;
}

function SummaryCard({ title, icon, children, color = Colors.primary }: SummaryCardProps) {
  return (
    <View style={scStyles.card}>
      <View style={scStyles.header}>
        <View style={[scStyles.iconWrap, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <Text style={scStyles.title}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={scStyles.row}>
      <Text style={scStyles.label}>{label}</Text>
      <Text style={scStyles.value}>{value || '-'}</Text>
    </View>
  );
}

const scStyles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 18, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: Colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  label: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: Colors.textSecondary, flex: 1 },
  value: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: Colors.text, flex: 1, textAlign: 'right' },
});

export default function ReviewScreen() {
  const insets = useSafeAreaInsets();
  const { language } = useApp();
  const { recordId } = useLocalSearchParams<{ recordId: string }>();
  const [record, setRecord] = useState<FieldRecord | null>(null);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  useEffect(() => {
    if (recordId) getRecord(recordId).then(r => r && setRecord(r));
  }, []);

  const handleSave = async () => {
    if (!record) return;
    record.syncStatus = 'pending';
    await saveRecord(record);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(t('saved', language), '', [
      { text: 'OK', onPress: () => router.replace('/dashboard') },
    ]);
  };

  if (!record) return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><Text style={{ fontFamily: 'Nunito_400Regular', color: Colors.textSecondary }}>Loading...</Text></View>;

  const zonesCompleted = record.zones.filter(z => z.completed).length;
  const photoCount = [record.entryPhotoUri, record.centerPhotoUri, record.harvestPhotoUri, record.weighmentPhotoUri, record.farmerPhotoUri, ...record.zones.map(z => z.cropPhotoUri), ...record.zones.map(z => z.cobPhotoUri)].filter(Boolean).length;
  const dataQuality = zonesCompleted === 3 && record.variety && record.totalHarvestWeight ? t('good', language) : t('incomplete', language);

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('review', language)}</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: bottomPad + 120 }}>
        <SummaryCard title={t('fieldInfo', language)} icon="location" color={Colors.primary}>
          <Row label={t('fieldId', language)} value={record.fieldId} />
          <Row label={t('district', language)} value={record.district} />
          <Row label={t('block', language)} value={record.block} />
          <Row label={t('village', language)} value={record.village} />
          <Row label={t('fieldArea', language)} value={`${record.fieldAreaAcres} ac / ${record.fieldAreaHectares} ha`} />
        </SummaryCard>

        <SummaryCard title={t('yieldData', language)} icon="trending-up" color={Colors.accent}>
          <Row label={t('totalHarvestWeight', language)} value={record.totalHarvestWeight ? `${record.totalHarvestWeight} kg` : ''} />
          <Row label={t('moisturePercent', language)} value={record.moisturePercent ? `${record.moisturePercent}%` : ''} />
          <Row label={t('dryWeight', language)} value={record.dryWeight ? `${record.dryWeight} kg` : ''} />
          <Row label={t('yieldKgHa', language)} value={record.yieldKgHa} />
          <Row label={t('yieldQuintalsAcre', language)} value={record.yieldQuintalsAcre} />
        </SummaryCard>

        <SummaryCard title={t('zonesCompletion', language)} icon="grid" color={Colors.success}>
          {record.zones.map((z) => (
            <View key={z.zoneId} style={styles.zoneRow}>
              <View style={[styles.zoneDot, { backgroundColor: z.zoneId === 'A' ? Colors.zoneGood : z.zoneId === 'B' ? Colors.zoneMedium : Colors.zoneWeak }]} />
              <Text style={styles.zoneLabel}>Zone {z.zoneId} - {z.label}</Text>
              <Ionicons name={z.completed ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={z.completed ? Colors.success : Colors.textLight} />
            </View>
          ))}
        </SummaryCard>

        <SummaryCard title={t('photoCount', language)} icon="images" color="#9C27B0">
          <Row label={t('photoCount', language)} value={`${photoCount} / 11`} />
        </SummaryCard>

        <SummaryCard title={t('dataQuality', language)} icon="shield-checkmark" color={dataQuality === t('good', language) ? Colors.success : Colors.warning}>
          <View style={[styles.qualityBadge, { backgroundColor: dataQuality === t('good', language) ? '#E8F5E9' : '#FFF3E0' }]}>
            <Ionicons name={dataQuality === t('good', language) ? 'checkmark-circle' : 'alert-circle'} size={20} color={dataQuality === t('good', language) ? Colors.success : Colors.warning} />
            <Text style={[styles.qualityText, { color: dataQuality === t('good', language) ? Colors.success : Colors.warning }]}>{dataQuality}</Text>
          </View>
        </SummaryCard>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 16 }]}>
        <View style={styles.footerRow}>
          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && { transform: [{ scale: 0.97 }] }]}
            onPress={handleSave}
          >
            <Ionicons name="save" size={20} color={Colors.white} />
            <Text style={styles.saveBtnText}>{t('saveLocally', language)}</Text>
          </Pressable>
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
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  zoneRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  zoneDot: { width: 10, height: 10, borderRadius: 5 },
  zoneLabel: { flex: 1, fontSize: 14, fontFamily: 'Nunito_400Regular', color: Colors.text },
  qualityBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10 },
  qualityText: { fontSize: 15, fontFamily: 'Nunito_700Bold' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  footerRow: { flexDirection: 'row', gap: 12 },
  saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, gap: 8 },
  saveBtnText: { fontSize: 17, fontFamily: 'Nunito_700Bold', color: Colors.white },
});
