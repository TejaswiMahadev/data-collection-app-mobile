import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Language } from './i18n';
import { getLanguage, setLanguage as storeLanguage, getSelfie, saveSelfie as storeSelfie, getVoicePreference } from './storage';

interface AppContextValue {
  language: Language;
  changeLanguage: (lang: Language) => void;
  selfieUri: string | null;
  setSelfieUri: (uri: string) => void;
  fontsLoaded: boolean;
  isLanguageSet: boolean;
  isVoiceOn: boolean;
  isVoicePrefSet: boolean;
  toggleVoice: (val?: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children, fontsLoaded }: { children: ReactNode; fontsLoaded: boolean }) {
  const [language, setLang] = useState<Language>('en');
  const [selfieUri, setSelfie] = useState<string | null>(null);
  const [isLanguageSet, setIsLanguageSet] = useState(false);
  const [ready, setReady] = useState(false);
  const [isVoiceOn, setIsVoiceOn] = useState(false);
  const [isVoicePrefSet, setIsVoicePrefSet] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const lang = await getLanguage();
        if (lang) {
          setLang(lang as Language);
          setIsLanguageSet(true);
        }
        const uri = await getSelfie();
        setSelfie(uri);
        const voicePref = await getVoicePreference();
        if (voicePref) {
          setIsVoiceOn(voicePref === 'yes');
          setIsVoicePrefSet(true);
        }
        // Sync records in background
        import('./storage').then(m => m.syncRecords()).catch(() => { });
      } catch (error) {
        console.error('Failed to initialize AppContext:', error);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const changeLanguage = (lang: Language) => {
    setLang(lang);
    setIsLanguageSet(true);
    storeLanguage(lang);
  };

  const setSelfieUri = (uri: string) => {
    setSelfie(uri);
    storeSelfie(uri);
  };

  const toggleVoice = (val?: boolean) => {
    setIsVoiceOn(prev => val !== undefined ? val : !prev);
    setIsVoicePrefSet(true);
  };

  const value = useMemo(() => ({
    language,
    changeLanguage,
    selfieUri,
    setSelfieUri,
    fontsLoaded,
    isLanguageSet,
    isVoiceOn,
    isVoicePrefSet,
    toggleVoice,
  }), [language, selfieUri, fontsLoaded, isLanguageSet, isVoiceOn, isVoicePrefSet]);

  if (!ready) return null;

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
