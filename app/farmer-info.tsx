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
import { StepInput, StepPicker } from '@/components/StepInput';

export default function FarmerInfoScreen() {
  const insets = useSafeAreaInsets();
  const { language } = useApp();
  const { recordId } = useLocalSearchParams<{ recordId: string }>();
  const [record, setRecord] = useState<FieldRecord | null>(null);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  useEffect(() => {
    if (recordId) getRecord(recordId).then(r => r && setRecord(r));
  }, []);

  const update = (key: keyof FieldRecord, value: string) => {
    if (!record) return;
    const updated = { ...record, [key]: value };
    setRecord(updated);
    saveRecord(updated);
  };

  const validate = (): boolean => {
    if (!record) return false;
    if (record.farmerPhone && record.farmerPhone.length !== 10) {
      Alert.alert(t('validationError', language), t('phoneValidation', language));
      return false;
    }
    if (record.collectorPhone && record.collectorPhone.length !== 10) {
      Alert.alert(t('validationError', language), t('phoneValidation', language));
      return false;
    }
    return true;
  };

  const goToReview = () => {
    if (!validate()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/review', params: { recordId: record!.id } });
  };

  if (!record) return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><Text style={{ fontFamily: 'Nunito_400Regular', color: Colors.textSecondary }}>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('farmerInfo', language)}</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: bottomPad + 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <StepInput label={t('farmerName', language)} value={record.farmerName} onChangeText={(v) => update('farmerName', v)} placeholder="e.g. Rajesh Kumar" autoFocus={true} onSubmit={() => {}} />
          <StepInput label={t('farmerPhone', language)} value={record.farmerPhone} onChangeText={(v) => update('farmerPhone', v)} keyboardType="phone-pad" placeholder="10 digits" onSubmit={() => {}} />
          <StepPicker label={t('landOwnership', language)} value={record.landOwnership} options={[
            { label: t('owner', language), value: 'owner' },
            { label: t('tenant', language), value: 'tenant' },
            { label: t('leased', language), value: 'leased' },
          ]} onSelect={(v) => update('landOwnership', v)} />
          <StepPicker label={t('consent', language)} value={record.consent} options={[
            { label: t('yes', language), value: 'yes' },
            { label: t('no', language), value: 'no' },
          ]} onSelect={(v) => update('consent', v)} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Collector</Text>
          <StepInput label={t('collectorName', language)} value={record.collectorName} onChangeText={(v) => update('collectorName', v)} placeholder="e.g. Amit Singh" onSubmit={() => {}} />
          <StepInput label={t('collectorPhone', language)} value={record.collectorPhone} onChangeText={(v) => update('collectorPhone', v)} keyboardType="phone-pad" placeholder="10 digits" onSubmit={() => {}} />
          <StepInput label={t('timeSpent', language)} value={record.timeSpent} onChangeText={(v) => update('timeSpent', v)} keyboardType="numeric" placeholder="e.g. 45" returnKeyType="done" onSubmit={goToReview} />
        </View>
      </ScrollView>
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
  card: { backgroundColor: Colors.surface, borderRadius: 20, padding: 24, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  sectionTitle: { fontSize: 18, fontFamily: 'Nunito_700Bold', color: Colors.text, marginBottom: 16 },
});
