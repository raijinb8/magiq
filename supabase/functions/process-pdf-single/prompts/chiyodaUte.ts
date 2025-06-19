// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const CHIYODA_UTE_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('CHIYODA_UTE', 'チヨダウーテ', fileName);
};

export const CHIYODA_UTE_COMPANY_INFO = {
  companyId: 'CHIYODA_UTE',
  companyName: 'チヨダウーテ',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['チヨダウーテ固有のPDF形式に対応予定']
} as const;