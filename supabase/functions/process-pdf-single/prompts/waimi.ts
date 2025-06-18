// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const WAIMI_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('WAIMI', '和以美', fileName);
};

export const WAIMI_COMPANY_INFO = {
  companyId: 'WAIMI',
  companyName: '和以美',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['和以美固有のPDF形式に対応予定']
} as const;