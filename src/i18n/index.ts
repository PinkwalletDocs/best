import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zh from './locales/zh.json'
import en from './locales/en.json'
import th from './locales/th.json'
import vi from './locales/vi.json'
import ja from './locales/ja.json'

export const languages = {
  zh: { name: '中文', flag: '🇨🇳' },
  en: { name: 'English', flag: '🇺🇸' },
  th: { name: 'ไทย', flag: '🇹🇭' },
  vi: { name: 'Tiếng Việt', flag: '🇻🇳' },
  ja: { name: '日本語', flag: '🇯🇵' },
} as const

export type Language = keyof typeof languages

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
    th: { translation: th },
    vi: { translation: vi },
    ja: { translation: ja },
  },
  lng: 'th',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
