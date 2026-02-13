import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Language } from './i18n';
import { getLanguage, setLanguage as storeLanguage, getSelfie, saveSelfie as storeSelfie } from './storage';

interface AppContextValue {
  language: Language;
  changeLanguage: (lang: Language) => void;
  selfieUri: string | null;
  setSelfieUri: (uri: string) => void;
  fontsLoaded: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children, fontsLoaded }: { children: ReactNode; fontsLoaded: boolean }) {
  const [language, setLang] = useState<Language>('en');
  const [selfieUri, setSelfie] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const lang = await getLanguage();
      setLang(lang as Language);
      const uri = await getSelfie();
      setSelfie(uri);
      setReady(true);
    })();
  }, []);

  const changeLanguage = (lang: Language) => {
    setLang(lang);
    storeLanguage(lang);
  };

  const setSelfieUri = (uri: string) => {
    setSelfie(uri);
    storeSelfie(uri);
  };

  const value = useMemo(() => ({
    language,
    changeLanguage,
    selfieUri,
    setSelfieUri,
    fontsLoaded,
  }), [language, selfieUri, fontsLoaded]);

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
