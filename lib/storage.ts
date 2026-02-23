import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { FieldRecord } from './types';

const RECORDS_KEY = 'vitainspire_records';
const LANGUAGE_KEY = 'vitainspire_language';
const SELFIE_KEY = 'vitainspire_selfie';
const VOICE_KEY = 'vitainspire_voice';

// Use EXPO_PUBLIC_SERVER_URL if set, otherwise fallback to localhost for web/emulator
const API_BASE_URL = process.env.EXPO_PUBLIC_SERVER_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

export async function getAllRecords(): Promise<FieldRecord[]> {
  try {
    const data = await AsyncStorage.getItem(RECORDS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse records:', error);
    return [];
  }
}

export async function getRecord(id: string): Promise<FieldRecord | null> {
  const records = await getAllRecords();
  return records.find((r) => r.id === id) || null;
}

export async function saveRecord(record: FieldRecord): Promise<void> {
  try {
    const records = await getAllRecords();
    const idx = records.findIndex((r) => r.id === record.id);
    record.updatedAt = Date.now();

    if (idx >= 0) {
      records[idx] = record;
    } else {
      records.push(record);
    }
    await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(records));

    // Attempt to sync to server
    syncRecords().catch(err => console.error('Background sync failed:', err));
  } catch (error) {
    console.error('Failed to save record:', error);
  }
}

export async function syncRecords(): Promise<void> {
  try {
    const records = await getAllRecords();
    const pending = records.filter(r => r.syncStatus !== 'synced');

    if (pending.length === 0) return;

    for (const record of pending) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/records`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(record),
        });

        if (response.ok) {
          record.syncStatus = 'synced';
          // Update the specific record in local storage
          const all = await getAllRecords();
          const idx = all.findIndex(r => r.id === record.id);
          if (idx >= 0) {
            all[idx].syncStatus = 'synced';
            await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(all));
          }
        }
      } catch (err) {
        console.warn(`Failed to sync record ${record.id}:`, err);
      }
    }
  } catch (error) {
    console.error('Sync process failed:', error);
  }
}

export async function deleteRecord(id: string): Promise<void> {
  try {
    const records = await getAllRecords();
    const filtered = records.filter((r) => r.id !== id);
    await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete record:', error);
  }
}

export async function getLanguage(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LANGUAGE_KEY);
  } catch (error) {
    console.error('Failed to get language:', error);
    return null;
  }
}

export async function setLanguage(lang: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch (error) {
    console.error('Failed to set language:', error);
  }
}

export async function getSelfie(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(SELFIE_KEY);
  } catch (error) {
    console.error('Failed to get selfie:', error);
    return null;
  }
}

export async function saveSelfie(uri: string): Promise<void> {
  try {
    await AsyncStorage.setItem(SELFIE_KEY, uri);
  } catch (error) {
    console.error('Failed to save selfie:', error);
  }
}

export async function getVoicePreference(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(VOICE_KEY);
  } catch (error) {
    console.error('Failed to get voice pref:', error);
    return null;
  }
}

export async function setVoicePreference(val: 'yes' | 'no'): Promise<void> {
  try {
    await AsyncStorage.setItem(VOICE_KEY, val);
  } catch (error) {
    console.error('Failed to save voice pref:', error);
  }
}
