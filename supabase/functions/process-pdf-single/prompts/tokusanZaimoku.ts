// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const TOKUSAN_ZAIMOKU_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('TOKUSAN_ZAIMOKU', '徳三材木', fileName);
};

export const TOKUSAN_ZAIMOKU_COMPANY_INFO = {
  companyId: 'TOKUSAN_ZAIMOKU',
  companyName: '徳三材木',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['徳三材木固有のPDF形式に対応予定']
} as const;