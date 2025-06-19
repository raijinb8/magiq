// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const JAPAN_KENZAI_AIDA_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('JAPAN_KENZAI_AIDA', 'ジャパン建材_アイダ設計', fileName);
};

export const JAPAN_KENZAI_AIDA_COMPANY_INFO = {
  companyId: 'JAPAN_KENZAI_AIDA',
  companyName: 'ジャパン建材_アイダ設計',
  parentCompany: 'ジャパン建材',
  subCompany: 'アイダ設計',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['ジャパン建材_アイダ設計固有のPDF形式に対応予定']
} as const;