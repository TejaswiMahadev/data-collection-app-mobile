import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';
import { t } from '@/lib/i18n';
import { getAllRecords } from '@/lib/storage';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { language, selfieUri } = useApp();
  const [recordCount, setRecordCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = async () => {
    const records = await getAllRecords();
    setRecordCount(records.length);
    setPendingCount(records.filter(r => r.syncStatus === 'pending').length);
  };

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary, '#43A047']}
        style={[styles.header, { paddingTop: topPad + 20 }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{t('appName', language)}</Text>
            <Text style={styles.headerSub}>{t('tagline', language)}</Text>
          </View>
          {selfieUri && (
            <View style={styles.avatarWrap}>
              <Image source={{ uri: selfieUri }} style={styles.avatar} contentFit="cover" />
            </View>
          )}
        </View>

        {pendingCount > 0 && (
          <View style={styles.syncBadge}>
            <Ionicons name="cloud-upload-outline" size={16} color={Colors.accent} />
            <Text style={styles.syncBadgeText}>
              {pendingCount} {t('pending', language)}
            </Text>
          </View>
        )}
      </LinearGradient>

      <View style={[styles.body, { paddingBottom: bottomPad + 20 }]}>
        <Pressable
          style={({ pressed }) => [styles.mainCard, pressed && { transform: [{ scale: 0.97 }] }]}
          onPress={() => router.push('/field-entry')}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryLight]}
            style={styles.mainCardGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.mainCardIcon}>
              <MaterialCommunityIcons name="plus-circle" size={40} color={Colors.white} />
            </View>
            <Text style={styles.mainCardTitle}>{t('newEntry', language)}</Text>
            <Text style={styles.mainCardSub}>{t('fieldIdentification', language)}</Text>
          </LinearGradient>
        </Pressable>

        <View style={styles.gridRow}>
          <Pressable
            style={({ pressed }) => [styles.gridCard, pressed && { transform: [{ scale: 0.96 }] }]}
            onPress={() => router.push('/records')}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="document-text" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.gridTitle}>{t('myRecords', language)}</Text>
            <Text style={styles.gridCount}>{recordCount}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.gridCard, pressed && { transform: [{ scale: 0.96 }] }]}
            onPress={() => {
              Alert.alert(t('dataSafe', language));
            }}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#FFF8E1' }]}>
              <Ionicons name="cloud-upload" size={28} color={Colors.accent} />
            </View>
            <Text style={styles.gridTitle}>{t('syncData', language)}</Text>
            <Text style={styles.gridCount}>{pendingCount} {t('pending', language)}</Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [styles.settingsCard, pressed && { transform: [{ scale: 0.97 }] }]}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.settingsText}>{t('settings', language)}</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
        </Pressable>
      </View>
    </View>
  );
}

import { Alert } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.white,
  },
  headerSub: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  avatarWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: Colors.accent,
    overflow: 'hidden',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 16,
    gap: 6,
  },
  syncBadgeText: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.accent,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  mainCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  mainCardGrad: {
    padding: 28,
    alignItems: 'center',
  },
  mainCardIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainCardTitle: {
    fontSize: 22,
    fontFamily: 'Nunito_700Bold',
    color: Colors.white,
  },
  mainCardSub: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  gridCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  gridIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridTitle: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.text,
    textAlign: 'center',
  },
  gridCount: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  settingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  settingsText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.text,
  },
});
