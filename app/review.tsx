import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
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
import { StepInput } from '@/components/StepInput';
import { playVoiceInstruction, stopVoiceInstruction } from '@/lib/tts';

interface SummarySectionProps {
  title: string;
  icon: string;
  isEditing: boolean;
  onEditToggle: () => void;
  children: React.ReactNode;
  color?: string;
  language?: any;
}

function SummarySection({ title, icon, isEditing, onEditToggle, children, color = Colors.primary, language = 'en' }: SummarySectionProps) {
  return (
    <View style={[scStyles.card, isEditing && scStyles.cardEditing]}>
      <View style={scStyles.header}>
        <View style={[scStyles.iconWrap, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <Text style={scStyles.title}>{title}</Text>
        <View style={{ width: 8 }} />
        <Pressable
          onPress={onEditToggle}
          style={({ pressed }) => [scStyles.editBtn, pressed && { opacity: 0.7 }, isEditing && { backgroundColor: Colors.success + '15' }]}
        >
          <Ionicons name={isEditing ? "checkmark-circle" : "pencil"} size={20} color={isEditing ? Colors.success : Colors.primary} />
          <Text style={[scStyles.editBtnText, { color: isEditing ? Colors.success : Colors.primary }]}>
            {isEditing ? t('done', language) : t('edit', language)}
          </Text>
        </Pressable>
      </View>
      <View style={isEditing ? scStyles.contentEditing : null}>
        {children}
      </View>
    </View>
  );
}

function DataRow({ label, value, isEditing, onChangeText, type = 'text' }: {
  label: string;
  value: string;
  isEditing?: boolean;
  onChangeText?: (v: string) => void;
  type?: 'text' | 'phone' | 'date' | 'number';
}) {
  if (isEditing && onChangeText) {
    return (
      <View style={scStyles.rowEdit}>
        <StepInput
          label={label}
          value={value}
          onChangeText={onChangeText}
          type={type}
        />
      </View>
    );
  }

  return (
    <View style={scStyles.row}>
      <Text style={scStyles.label}>{label}</Text>
      <Text style={scStyles.value}>{value || '-'}</Text>
    </View>
  );
}

const scStyles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 18, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, borderWidth: 1, borderColor: 'transparent' },
  cardEditing: { borderColor: Colors.primary + '30', backgroundColor: Colors.surface, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, fontSize: 16, fontFamily: 'Nunito_700Bold', color: Colors.text },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, backgroundColor: Colors.surfaceAlt },
  editBtnText: { fontSize: 13, fontFamily: 'Nunito_700Bold' },
  contentEditing: { marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  rowEdit: { paddingVertical: 8 },
  label: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: Colors.textSecondary, flex: 1 },
  value: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: Colors.text, flex: 1, textAlign: 'right' },
});

export default function ReviewScreen() {
  const insets = useSafeAreaInsets();
  const { language } = useApp();
  const { recordId } = useLocalSearchParams<{ recordId: string }>();
  const [record, setRecord] = useState<FieldRecord | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  useEffect(() => {
    if (recordId) {
      getRecord(recordId).then(r => {
        if (r) setRecord(r);
        setLoading(false);
      });
    }
  }, [recordId]);

  const { isVoiceOn } = useApp();

  useEffect(() => {
    if (isVoiceOn && !loading) {
      playVoiceInstruction(t('review', language), language);
    }
    return () => {
      stopVoiceInstruction();
    };
  }, [loading, isVoiceOn, language]);

  const updateField = useCallback((field: keyof FieldRecord, value: string) => {
    if (!record) return;
    setRecord({ ...record, [field]: value });
  }, [record]);

  const handleSave = async () => {
    if (!record) return;
    record.syncStatus = 'pending';
    record.updatedAt = Date.now();
    await saveRecord(record);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(t('saved', language), '', [
      { text: 'OK', onPress: () => router.replace('/dashboard') },
    ]);
  };

  const toggleEdit = (section: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingSection(editingSection === section ? null : section);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!record) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontFamily: 'Nunito_400Regular', color: Colors.textSecondary }}>Record not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('review', language)}</Text>
          <Pressable onPress={() => router.replace('/dashboard')} style={styles.backBtn}>
            <Ionicons name="home" size={22} color={Colors.white} />
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: bottomPad + 120 }}>
        {/* Field Info */}
        <SummarySection
          title={t('fieldInfo', language)}
          icon="location"
          isEditing={editingSection === 'field'}
          onEditToggle={() => toggleEdit('field')}
          language={language}
        >
          <DataRow
            label={t('fieldId', language)}
            value={record.fieldId}
            isEditing={editingSection === 'field'}
            onChangeText={(v) => updateField('fieldId', v)}
          />
          <DataRow
            label={t('district', language)}
            value={record.district}
            isEditing={editingSection === 'field'}
            onChangeText={(v) => updateField('district', v)}
          />
          <DataRow
            label={t('block', language)}
            value={record.block}
            isEditing={editingSection === 'field'}
            onChangeText={(v) => updateField('block', v)}
          />
          <DataRow
            label={t('village', language)}
            value={record.village}
            isEditing={editingSection === 'field'}
            onChangeText={(v) => updateField('village', v)}
          />
          <DataRow
            label={t('fieldArea', language)}
            value={`${record.fieldAreaAcres} ac`}
            isEditing={editingSection === 'field'}
            onChangeText={(v) => updateField('fieldAreaAcres', v)}
            type="number"
          />
        </SummarySection>

        {/* Yield Data */}
        <SummarySection
          title={t('yieldData', language)}
          icon="trending-up"
          color={Colors.accent}
          isEditing={editingSection === 'yield'}
          onEditToggle={() => toggleEdit('yield')}
          language={language}
        >
          <DataRow
            label={t('totalHarvestWeight', language)}
            value={record.totalHarvestWeight ? `${record.totalHarvestWeight} kg` : ''}
            isEditing={editingSection === 'yield'}
            onChangeText={(v) => updateField('totalHarvestWeight', v)}
            type="number"
          />
          <DataRow
            label={t('moisturePercent', language)}
            value={record.moisturePercent ? `${record.moisturePercent}%` : ''}
            isEditing={editingSection === 'yield'}
            onChangeText={(v) => updateField('moisturePercent', v)}
            type="number"
          />
          <DataRow label={t('dryWeight', language)} value={record.dryWeight ? `${record.dryWeight} kg` : ''} type="number" />
          <DataRow label={t('yieldKgHa', language)} value={record.yieldKgHa} type="number" />
        </SummarySection>

        {/* Farmer Info */}
        <SummarySection
          title={t('farmerInfo', language)}
          icon="person"
          color={Colors.primaryLight}
          isEditing={editingSection === 'farmer'}
          onEditToggle={() => toggleEdit('farmer')}
          language={language}
        >
          <DataRow
            label={t('farmerName', language)}
            value={record.farmerName}
            isEditing={editingSection === 'farmer'}
            onChangeText={(v) => updateField('farmerName', v)}
          />
          <DataRow
            label={t('farmerPhone', language)}
            value={record.farmerPhone}
            isEditing={editingSection === 'farmer'}
            onChangeText={(v) => updateField('farmerPhone', v)}
            type="phone"
          />
        </SummarySection>

        {/* Collector Info */}
        <SummarySection
          title={t('collectorInfo', language)}
          icon="clipboard"
          color={Colors.zoneGood}
          isEditing={editingSection === 'collector'}
          onEditToggle={() => toggleEdit('collector')}
          language={language}
        >
          <DataRow
            label={t('collectorName', language)}
            value={record.collectorName}
            isEditing={editingSection === 'collector'}
            onChangeText={(v) => updateField('collectorName', v)}
          />
          <DataRow
            label={t('collectorPhone', language)}
            value={record.collectorPhone}
            isEditing={editingSection === 'collector'}
            onChangeText={(v) => updateField('collectorPhone', v)}
            type="phone"
          />
        </SummarySection>
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
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  footerRow: { flexDirection: 'row', gap: 12 },
  saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, gap: 8 },
  saveBtnText: { fontSize: 17, fontFamily: 'Nunito_700Bold', color: Colors.white },
});
