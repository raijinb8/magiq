// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const JONAN_SATO_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('JONAN_SATO', '城南佐藤工務店', fileName);
};

export const JONAN_SATO_COMPANY_INFO = {
  companyId: 'JONAN_SATO',
  companyName: '城南佐藤工務店',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['城南佐藤工務店固有のPDF形式に対応予定']
} as const;