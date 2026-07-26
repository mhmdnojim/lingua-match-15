export interface LanguageDef {
  /** unique code used as column id and value key */
  code: string;
  /** English name */
  name: string;
  /** native name shown in pickers */
  native: string;
  /** BCP-47 locale for speech synthesis */
  locale: string;
  rtl?: boolean;
  /** css font class from index.css */
  fontClass?: string;
  /** when set, this "language" is the romanization of another language */
  romanizationOf?: string;
  /** label of the romanization system this language has (pinyin, romaji...) */
  romanizationLabel?: string;
  /** short badge label */
  short: string;
}

export const LANGUAGES: LanguageDef[] = [
  { code: 'zh', name: 'Chinese (Simplified)', native: '中文', locale: 'zh-CN', fontClass: 'font-chinese', romanizationLabel: 'Pinyin', short: '中' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', native: '繁體中文', locale: 'zh-TW', fontClass: 'font-chinese', romanizationLabel: 'Pinyin', short: '繁' },
  { code: 'zh-pinyin', name: 'Pinyin', native: '拼音', locale: 'zh-CN', romanizationOf: 'zh', short: '拼' },
  { code: 'en', name: 'English', native: 'English', locale: 'en-US', short: 'EN' },
  { code: 'ar', name: 'Arabic', native: 'العربية', locale: 'ar-SA', rtl: true, fontClass: 'font-arabic', romanizationLabel: 'Transliteration', short: 'ع' },
  { code: 'ar-latin', name: 'Arabic transliteration', native: 'Translit.', locale: 'en-US', romanizationOf: 'ar', short: 'AR-L' },
  { code: 'es', name: 'Spanish', native: 'Español', locale: 'es-ES', short: 'ES' },
  { code: 'fr', name: 'French', native: 'Français', locale: 'fr-FR', short: 'FR' },
  { code: 'de', name: 'German', native: 'Deutsch', locale: 'de-DE', short: 'DE' },
  { code: 'it', name: 'Italian', native: 'Italiano', locale: 'it-IT', short: 'IT' },
  { code: 'pt', name: 'Portuguese', native: 'Português', locale: 'pt-BR', short: 'PT' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands', locale: 'nl-NL', short: 'NL' },
  { code: 'sv', name: 'Swedish', native: 'Svenska', locale: 'sv-SE', short: 'SV' },
  { code: 'pl', name: 'Polish', native: 'Polski', locale: 'pl-PL', short: 'PL' },
  { code: 'ru', name: 'Russian', native: 'Русский', locale: 'ru-RU', romanizationLabel: 'Transliteration', short: 'RU' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', locale: 'tr-TR', short: 'TR' },
  { code: 'ja', name: 'Japanese', native: '日本語', locale: 'ja-JP', romanizationLabel: 'Romaji', short: '日' },
  { code: 'ja-romaji', name: 'Romaji', native: 'Rōmaji', locale: 'ja-JP', romanizationOf: 'ja', short: 'JA-R' },
  { code: 'ko', name: 'Korean', native: '한국어', locale: 'ko-KR', romanizationLabel: 'Romaja', short: '한' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', locale: 'hi-IN', romanizationLabel: 'Transliteration', short: 'HI' },
  { code: 'ur', name: 'Urdu', native: 'اردو', locale: 'ur-PK', rtl: true, fontClass: 'font-arabic', romanizationLabel: 'Transliteration', short: 'UR' },
  { code: 'fa', name: 'Persian', native: 'فارسی', locale: 'fa-IR', rtl: true, fontClass: 'font-arabic', romanizationLabel: 'Transliteration', short: 'FA' },
  { code: 'he', name: 'Hebrew', native: 'עברית', locale: 'he-IL', rtl: true, romanizationLabel: 'Transliteration', short: 'HE' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', locale: 'id-ID', short: 'ID' },
  { code: 'ms', name: 'Malay', native: 'Bahasa Melayu', locale: 'ms-MY', short: 'MS' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', locale: 'vi-VN', short: 'VI' },
  { code: 'bg', name: 'Bulgarian', native: 'Български', locale: 'bg-BG', romanizationLabel: 'Transliteration', short: 'BG' },
  { code: 'kk', name: 'Kazakh', native: 'Қазақша', locale: 'kk-KZ', romanizationLabel: 'Transliteration', short: 'KK' },
  { code: 'tk', name: 'Turkmen', native: 'Türkmençe', locale: 'tk-TM', short: 'TK' },
  { code: 'th', name: 'Thai', native: 'ไทย', locale: 'th-TH', romanizationLabel: 'Transliteration', short: 'TH' },
];

export const LANGUAGE_MAP: Record<string, LanguageDef> = LANGUAGES.reduce(
  (acc, lang) => ({ ...acc, [lang.code]: lang }),
  {} as Record<string, LanguageDef>,
);

export function getLanguage(code: string): LanguageDef {
  return LANGUAGE_MAP[code] || { code, name: code, native: code, locale: 'en-US', short: code.slice(0, 2).toUpperCase() };
}

/** Languages that can be picked as a column (romanization pseudo-languages included) */
export const PICKABLE_LANGUAGES = LANGUAGES;

/** Languages that can be the main (source) column — no romanization pseudo-languages */
export const MAIN_LANGUAGES = LANGUAGES.filter(l => !l.romanizationOf);

const HEADER_ALIASES: Record<string, string> = {
  chinese: 'zh',
  中文: 'zh',
  汉字: 'zh',
  hanzi: 'zh',
  mandarin: 'zh',
  zh: 'zh',
  'chinese (simplified)': 'zh',
  traditional: 'zh-TW',
  繁體中文: 'zh-TW',
  'zh-tw': 'zh-TW',
  pinyin: 'zh-pinyin',
  拼音: 'zh-pinyin',
  pronunciation: 'zh-pinyin',
  romaji: 'ja-romaji',
  romaja: 'ko',
  english: 'en',
  英文: 'en',
  meaning: 'en',
  definition: 'en',
  translation: 'en',
  en: 'en',
  arabic: 'ar',
  عربي: 'ar',
  العربية: 'ar',
  ar: 'ar',
  spanish: 'es',
  español: 'es',
  french: 'fr',
  français: 'fr',
  german: 'de',
  deutsch: 'de',
  italian: 'it',
  italiano: 'it',
  portuguese: 'pt',
  português: 'pt',
  dutch: 'nl',
  nederlands: 'nl',
  swedish: 'sv',
  polish: 'pl',
  russian: 'ru',
  русский: 'ru',
  turkish: 'tr',
  türkçe: 'tr',
  japanese: 'ja',
  日本語: 'ja',
  korean: 'ko',
  한국어: 'ko',
  hindi: 'hi',
  हिन्दी: 'hi',
  urdu: 'ur',
  اردو: 'ur',
  persian: 'fa',
  farsi: 'fa',
  فارسی: 'fa',
  hebrew: 'he',
  עברית: 'he',
  indonesian: 'id',
  malay: 'ms',
  vietnamese: 'vi',
  thai: 'th',
  bulgarian: 'bg',
  български: 'bg',
  bg: 'bg',
  kazakh: 'kk',
  қазақша: 'kk',
  kk: 'kk',
  turkmen: 'tk',
  türkmençe: 'tk',
  tk: 'tk',
  vietnamese_vi: 'vi',
  'tiếng việt': 'vi',
  vi: 'vi',
};

/** Try to map an excel header to a language code */
export function detectLanguageFromHeader(header: string): string | null {
  const key = header.toLowerCase().trim();
  if (HEADER_ALIASES[key]) return HEADER_ALIASES[key];
  const byName = LANGUAGES.find(
    l => l.name.toLowerCase() === key || l.native.toLowerCase() === key || l.code.toLowerCase() === key,
  );
  return byName ? byName.code : null;
}

/** Visual style per column position (cycled) */
export const COLUMN_STYLES = [
  {
    card: 'bg-game-chinese/70 hover:bg-game-chinese/90 hover:shadow-game-chinese/30',
    solid: 'bg-game-chinese',
    text: 'text-game-chinese',
  },
  {
    card: 'bg-game-english/70 hover:bg-game-english/90 hover:shadow-game-english/30',
    solid: 'bg-game-english',
    text: 'text-game-english',
  },
  {
    card: 'bg-game-arabic/70 hover:bg-game-arabic/90 hover:shadow-game-arabic/30',
    solid: 'bg-game-arabic',
    text: 'text-game-arabic',
  },
  {
    card: 'bg-game-pinyin/70 hover:bg-game-pinyin/90 hover:shadow-game-pinyin/30',
    solid: 'bg-game-pinyin',
    text: 'text-game-pinyin',
  },
];

export function columnStyle(index: number) {
  return COLUMN_STYLES[index % COLUMN_STYLES.length];
}

/** Code of the romanization pseudo-language attached to a language, if any */
export function romanizationCodeFor(code: string): string | null {
  const found = LANGUAGES.find(l => l.romanizationOf === code);
  return found ? found.code : null;
}
