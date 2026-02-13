import AsyncStorage from '@react-native-async-storage/async-storage';
import { FieldRecord } from './types';

const RECORDS_KEY = 'vitainspire_records';
const LANGUAGE_KEY = 'vitainspire_language';
const SELFIE_KEY = 'vitainspire_selfie';

export async function getAllRecords(): Promise<FieldRecord[]> {
  const data = await AsyncStorage.getItem(RECORDS_KEY);
  if (!data) return [];
  return JSON.parse(data);
}

export async function getRecord(id: string): Promise<FieldRecord | null> {
  const records = await getAllRecords();
  return records.find((r) => r.id === id) || null;
}

export async function saveRecord(record: FieldRecord): Promise<void> {
  const records = await getAllRecords();
  const idx = records.findIndex((r) => r.id === record.id);
  record.updatedAt = Date.now();
  if (idx >= 0) {
    records[idx] = record;
  } else {
    records.push(record);
  }
  await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export async function deleteRecord(id: string): Promise<void> {
  const records = await getAllRecords();
  const filtered = records.filter((r) => r.id !== id);
  await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(filtered));
}

export async function getLanguage(): Promise<string> {
  const lang = await AsyncStorage.getItem(LANGUAGE_KEY);
  return lang || 'en';
}

export async function setLanguage(lang: string): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
}

export async function getSelfie(): Promise<string | null> {
  return AsyncStorage.getItem(SELFIE_KEY);
}

export async function saveSelfie(uri: string): Promise<void> {
  await AsyncStorage.setItem(SELFIE_KEY, uri);
}
