// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const ISHIDA_MOKUZAI_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('ISHIDA_MOKUZAI', '石田木材', fileName);
};

export const ISHIDA_MOKUZAI_COMPANY_INFO = {
  companyId: 'ISHIDA_MOKUZAI',
  companyName: '石田木材',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['石田木材固有のPDF形式に対応予定']
} as const;