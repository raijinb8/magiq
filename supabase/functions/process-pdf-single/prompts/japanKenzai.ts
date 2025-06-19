// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const JAPAN_KENZAI_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('JAPAN_KENZAI', 'ジャパン建材', fileName);
};

export const JAPAN_KENZAI_COMPANY_INFO = {
  companyId: 'JAPAN_KENZAI',
  companyName: 'ジャパン建材',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['ジャパン建材固有のPDF形式に対応予定']
} as const;