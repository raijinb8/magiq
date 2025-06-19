// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const WATABE_KOUMUTEN_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('WATABE_KOUMUTEN', '渡部工務店', fileName);
};

export const WATABE_KOUMUTEN_COMPANY_INFO = {
  companyId: 'WATABE_KOUMUTEN',
  companyName: '渡部工務店',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['渡部工務店固有のPDF形式に対応予定']
} as const;