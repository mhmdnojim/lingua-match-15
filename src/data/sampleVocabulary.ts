import { VocabularyItem } from '@/utils/excelParser';

export const sampleVocabulary: VocabularyItem[] = [
  { id: 'sample-1', values: { zh: '你好', 'zh-pinyin': 'nǐ hǎo', en: 'Hello', ar: 'مرحبا' } },
  { id: 'sample-2', values: { zh: '谢谢', 'zh-pinyin': 'xiè xie', en: 'Thank you', ar: 'شكرا' } },
  { id: 'sample-3', values: { zh: '再见', 'zh-pinyin': 'zài jiàn', en: 'Goodbye', ar: 'مع السلامة' } },
  { id: 'sample-4', values: { zh: '朋友', 'zh-pinyin': 'péng you', en: 'Friend', ar: 'صديق' } },
  { id: 'sample-5', values: { zh: '学习', 'zh-pinyin': 'xué xí', en: 'Study', ar: 'دراسة' } },
  { id: 'sample-6', values: { zh: '老师', 'zh-pinyin': 'lǎo shī', en: 'Teacher', ar: 'معلم' } },
  { id: 'sample-7', values: { zh: '学生', 'zh-pinyin': 'xué shēng', en: 'Student', ar: 'طالب' } },
  { id: 'sample-8', values: { zh: '书', 'zh-pinyin': 'shū', en: 'Book', ar: 'كتاب' } },
  { id: 'sample-9', values: { zh: '水', 'zh-pinyin': 'shuǐ', en: 'Water', ar: 'ماء' } },
  { id: 'sample-10', values: { zh: '爱', 'zh-pinyin': 'ài', en: 'Love', ar: 'حب' } },
];

export const sampleColumns = ['zh', 'zh-pinyin', 'en', 'ar'];
