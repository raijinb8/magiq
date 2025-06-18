// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const TAISEI_MOKUZAI_SEKISUI_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('TAISEI_MOKUZAI_SEKISUI', '大成木材_積水ハウス', fileName);
};

export const TAISEI_MOKUZAI_SEKISUI_COMPANY_INFO = {
  companyId: 'TAISEI_MOKUZAI_SEKISUI',
  companyName: '大成木材_積水ハウス',
  parentCompany: '大成木材',
  subCompany: '積水ハウス',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['大成木材_積水ハウス固有のPDF形式に対応予定']
} as const;