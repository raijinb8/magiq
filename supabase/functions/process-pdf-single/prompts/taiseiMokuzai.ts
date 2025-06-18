// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const TAISEI_MOKUZAI_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('TAISEI_MOKUZAI', '大成木材', fileName);
};

export const TAISEI_MOKUZAI_COMPANY_INFO = {
  companyId: 'TAISEI_MOKUZAI',
  companyName: '大成木材',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['大成木材固有のPDF形式に対応予定']
} as const;