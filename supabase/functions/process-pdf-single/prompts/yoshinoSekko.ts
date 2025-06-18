// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const YOSHINO_SEKKO_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('YOSHINO_SEKKO', '吉野石膏', fileName);
};

export const YOSHINO_SEKKO_COMPANY_INFO = {
  companyId: 'YOSHINO_SEKKO',
  companyName: '吉野石膏',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['吉野石膏固有のPDF形式に対応予定']
} as const;