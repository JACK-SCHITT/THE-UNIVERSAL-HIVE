import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language, detectBrowserLanguage, translate } from '@/lib/i18n';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const useLanguage = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: detectBrowserLanguage(),
      setLanguage: (language) => set({ language }),
      t: (key: string) => translate(key, get().language)
    }),
    {
      name: 'grokschitt-language'
    }
  )
);
