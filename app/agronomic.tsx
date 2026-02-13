import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';
import { t, Language } from '@/lib/i18n';
import { getRecord, saveRecord } from '@/lib/storage';
import { FieldRecord } from '@/lib/types';
import { StepInput, StepPicker } from '@/components/StepInput';
import { ProgressBar } from '@/components/ProgressBar';

type SectionKey = 'crop' | 'yield' | 'fertilizer' | 'irrigation' | 'pest' | 'soil' | 'stress';

const SECTIONS: SectionKey[] = ['crop', 'yield', 'fertilizer', 'irrigation', 'pest', 'soil', 'stress'];

function getSectionTitle(section: SectionKey, lang: Language): string {
  const map: Record<SectionKey, string> = {
    crop: t('cropInfo', lang),
    yield: t('yieldData', lang),
    fertilizer: t('fertilizerData', lang),
    irrigation: t('irrigationData', lang),
    pest: t('pestDisease', lang),
    soil: t('soilData', lang),
    stress: t('stressFactors', lang),
  };
  return map[section];
}

export default function AgronomicScreen() {
  const insets = useSafeAreaInsets();
  const { language } = useApp();
  const { recordId } = useLocalSearchParams<{ recordId: string }>();
  const [record, setRecord] = useState<FieldRecord | null>(null);
  const [sectionIdx, setSectionIdx] = useState(0);
  const sectionIdxRef = useRef(0);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  useEffect(() => {
    sectionIdxRef.current = sectionIdx;
  }, [sectionIdx]);

  useEffect(() => {
    if (recordId) {
      getRecord(recordId).then(r => r && setRecord(r));
    }
  }, []);

  const update = (key: keyof FieldRecord, value: any) => {
    if (!record) return;
    const updated = { ...record, [key]: value };

    if (key === 'totalHarvestWeight' || key === 'moisturePercent') {
      const weight = parseFloat(key === 'totalHarvestWeight' ? value : updated.totalHarvestWeight);
      const moisture = parseFloat(key === 'moisturePercent' ? value : updated.moisturePercent);
      if (!isNaN(weight) && !isNaN(moisture)) {
        const dryW = weight * (1 - moisture / 100);
        updated.dryWeight = dryW.toFixed(2);
        const hectares = parseFloat(updated.fieldAreaHectares);
        if (!isNaN(hectares) && hectares > 0) {
          updated.yieldKgHa = (dryW / hectares).toFixed(2);
          const acres = parseFloat(updated.fieldAreaAcres);
          if (!isNaN(acres) && acres > 0) {
            updated.yieldQuintalsAcre = ((dryW / 100) / acres).toFixed(2);
          }
        }
      }
    }

    if (key === 'sowingDate' && updated.harvestDate) {
      const sow = new Date(value);
      const harv = new Date(updated.harvestDate);
      if (!isNaN(sow.getTime()) && !isNaN(harv.getTime())) {
        const days = Math.round((harv.getTime() - sow.getTime()) / (1000 * 60 * 60 * 24));
        updated.growingDays = days > 0 ? days.toString() : '';
      }
    }

    setRecord(updated);
    saveRecord(updated);
  };

  const advanceSection = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const idx = sectionIdxRef.current;
    if (idx < SECTIONS.length - 1) {
      setSectionIdx(idx + 1);
    } else {
      if (record) {
        router.push({ pathname: '/final-photos', params: { recordId: record.id } });
      }
    }
  };

  const updateAndCheckAutoAdvance = (key: keyof FieldRecord, value: any, sectionKey: SectionKey) => {
    update(key, value);

    if (sectionKey === 'irrigation') {
      setTimeout(() => advanceSection(), 500);
    }
  };

  if (!record) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontFamily: 'Nunito_400Regular', color: Colors.textSecondary }}>Loading...</Text>
      </View>
    );
  }

  const section = SECTIONS[sectionIdx];

  const renderSection = () => {
    switch (section) {
      case 'crop':
        return (
          <>
            <StepInput label={t('variety', language)} value={record.variety} onChangeText={(v) => update('variety', v)} placeholder="e.g. DHM 117" autoFocus={true} onSubmit={() => {}} />
            <StepInput label={t('seedCompany', language)} value={record.seedCompany} onChangeText={(v) => update('seedCompany', v)} placeholder="e.g. Pioneer" onSubmit={() => {}} />
            <StepPicker label={t('seedType', language)} value={record.seedType} options={[
              { label: 'Hybrid', value: 'hybrid' },
              { label: 'OPV', value: 'opv' },
              { label: 'Local', value: 'local' },
            ]} onSelect={(v) => update('seedType', v)} />
            <StepInput label={t('harvestDate', language)} value={record.harvestDate} onChangeText={(v) => update('harvestDate', v)} placeholder="YYYY-MM-DD" returnKeyType="done" onSubmit={advanceSection} />
          </>
        );
      case 'yield':
        return (
          <>
            <StepInput label={t('totalHarvestWeight', language)} value={record.totalHarvestWeight} onChangeText={(v) => update('totalHarvestWeight', v)} keyboardType="decimal-pad" placeholder="e.g. 500" autoFocus={true} onSubmit={() => {}} />
            <StepInput label={t('moisturePercent', language)} value={record.moisturePercent} onChangeText={(v) => update('moisturePercent', v)} keyboardType="decimal-pad" placeholder="e.g. 14" returnKeyType="done" onSubmit={advanceSection} />
            <StepInput label={t('dryWeight', language)} value={record.dryWeight} onChangeText={() => {}} editable={false} />
            <StepInput label={t('yieldKgHa', language)} value={record.yieldKgHa} onChangeText={() => {}} editable={false} />
            <StepInput label={t('yieldQuintalsAcre', language)} value={record.yieldQuintalsAcre} onChangeText={() => {}} editable={false} />
          </>
        );
      case 'fertilizer':
        return (
          <>
            <StepInput label={t('sowingDate', language)} value={record.sowingDate} onChangeText={(v) => update('sowingDate', v)} placeholder="YYYY-MM-DD" autoFocus={true} onSubmit={() => {}} />
            <StepInput label={t('growingDays', language)} value={record.growingDays} onChangeText={() => {}} editable={false} />
            <StepInput label={t('basalFertilizer', language)} value={record.basalFertilizer} onChangeText={(v) => update('basalFertilizer', v)} placeholder="e.g. DAP 50kg" onSubmit={() => {}} />
            <StepInput label={t('topDressing1', language)} value={record.topDressing1} onChangeText={(v) => update('topDressing1', v)} placeholder="e.g. Urea 30kg" onSubmit={() => {}} />
            <StepInput label={t('topDressing2', language)} value={record.topDressing2} onChangeText={(v) => update('topDressing2', v)} placeholder="e.g. MOP 20kg" onSubmit={() => {}} />
            <StepInput label={t('organicManure', language)} value={record.organicManure} onChangeText={(v) => update('organicManure', v)} placeholder="e.g. FYM 2 ton" returnKeyType="done" onSubmit={advanceSection} />
          </>
        );
      case 'irrigation':
        return (
          <>
            <StepPicker label={t('irrigationType', language)} value={record.irrigationType} options={[
              { label: t('rainfed', language), value: 'rainfed' },
              { label: t('irrigated', language), value: 'irrigated' },
              { label: t('partial', language), value: 'partial' },
            ]} onSelect={(v) => update('irrigationType', v)} />
            <StepInput label={t('irrigationNumber', language)} value={record.irrigationNumber} onChangeText={(v) => update('irrigationNumber', v)} keyboardType="numeric" placeholder="e.g. 3" onSubmit={() => {}} />
            <StepInput label={t('waterSource', language)} value={record.waterSource} onChangeText={(v) => update('waterSource', v)} placeholder="e.g. Borewell" returnKeyType="done" onSubmit={advanceSection} />
          </>
        );
      case 'pest':
        return (
          <>
            <StepInput label={t('majorPest', language)} value={record.majorPest} onChangeText={(v) => update('majorPest', v)} placeholder="e.g. Stem borer" autoFocus={true} onSubmit={() => {}} />
            <StepPicker label={t('pestSeverity', language)} value={record.pestSeverity} options={[
              { label: t('none', language), value: 'none' },
              { label: t('low', language), value: 'low' },
              { label: t('medium', language), value: 'medium' },
              { label: t('high', language), value: 'high' },
              { label: t('severe', language), value: 'severe' },
            ]} onSelect={(v) => update('pestSeverity', v)} />
            <StepInput label={t('disease', language)} value={record.disease} onChangeText={(v) => update('disease', v)} placeholder="e.g. Leaf blight" onSubmit={() => {}} />
            <StepInput label={t('pesticideUsed', language)} value={record.pesticideUsed} onChangeText={(v) => update('pesticideUsed', v)} placeholder="e.g. Chlorpyrifos" returnKeyType="done" onSubmit={advanceSection} />
          </>
        );
      case 'soil':
        return (
          <>
            <StepPicker label={t('soilType', language)} value={record.soilType} options={[
              { label: t('loamy', language), value: 'loamy' },
              { label: t('sandy', language), value: 'sandy' },
              { label: t('clayey', language), value: 'clayey' },
              { label: t('laterite', language), value: 'laterite' },
            ]} onSelect={(v) => update('soilType', v)} />
            <StepInput label={t('soilPh', language)} value={record.soilPh} onChangeText={(v) => update('soilPh', v)} keyboardType="decimal-pad" placeholder="e.g. 6.5" onSubmit={() => {}} />
            <StepInput label={t('organicCarbon', language)} value={record.organicCarbon} onChangeText={(v) => update('organicCarbon', v)} placeholder="e.g. 0.5%" onSubmit={() => {}} />
            <StepInput label={t('npk', language)} value={record.npk} onChangeText={(v) => update('npk', v)} placeholder="e.g. 120:60:40" onSubmit={() => {}} />
            <StepInput label={t('previousCrop', language)} value={record.previousCrop} onChangeText={(v) => update('previousCrop', v)} placeholder="e.g. Rice" returnKeyType="done" onSubmit={advanceSection} />
          </>
        );
      case 'stress':
        return (
          <>
            <StepPicker label={t('rainfallPattern', language)} value={record.rainfallPattern} options={[
              { label: t('normal', language), value: 'normal' },
              { label: t('excess', language), value: 'excess' },
              { label: t('deficit', language), value: 'deficit' },
              { label: t('erratic', language), value: 'erratic' },
            ]} onSelect={(v) => update('rainfallPattern', v)} />
            <StepPicker label={t('drought', language)} value={record.drought} options={[
              { label: t('none', language), value: 'none' },
              { label: t('low', language), value: 'low' },
              { label: t('medium', language), value: 'medium' },
              { label: t('high', language), value: 'high' },
            ]} onSelect={(v) => update('drought', v)} />
            <StepPicker label={t('heatStress', language)} value={record.heatStress} options={[
              { label: t('none', language), value: 'none' },
              { label: t('low', language), value: 'low' },
              { label: t('medium', language), value: 'medium' },
              { label: t('high', language), value: 'high' },
            ]} onSelect={(v) => update('heatStress', v)} />
            <StepPicker label={t('lodging', language)} value={record.lodging} options={[
              { label: t('none', language), value: 'none' },
              { label: t('low', language), value: 'low' },
              { label: t('medium', language), value: 'medium' },
              { label: t('high', language), value: 'high' },
            ]} onSelect={(v) => update('lodging', v)} />
            <StepPicker label={t('standQuality', language)} value={record.standQuality} options={[
              { label: t('poor', language), value: 'poor' },
              { label: t('fair', language), value: 'fair' },
              { label: t('good', language), value: 'good' },
            ]} onSelect={(v) => update('standQuality', v)} />
            <StepPicker label={t('cobSize', language)} value={record.cobSize} options={[
              { label: t('small', language), value: 'small' },
              { label: t('medium', language), value: 'medium' },
              { label: t('large', language), value: 'large' },
            ]} onSelect={(v) => update('cobSize', v)} />
            <StepPicker label={t('grainFillQuality', language)} value={record.grainFillQuality} options={[
              { label: t('poor', language), value: 'poor' },
              { label: t('fair', language), value: 'fair' },
              { label: t('good', language), value: 'good' },
            ]} onSelect={(v) => {
              update('grainFillQuality', v);
              setTimeout(advanceSection, 500);
            }} />
          </>
        );
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary]}
        style={[styles.header, { paddingTop: topPad + 12 }]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => {
            if (sectionIdx > 0) setSectionIdx(sectionIdx - 1);
            else router.back();
          }} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('agronomicData', language)}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ProgressBar current={sectionIdx + 1} total={SECTIONS.length} label={getSectionTitle(section, language)} />
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: bottomPad + 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{getSectionTitle(section, language)}</Text>
          {renderSection()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: Colors.white,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
    marginBottom: 20,
  },
});
