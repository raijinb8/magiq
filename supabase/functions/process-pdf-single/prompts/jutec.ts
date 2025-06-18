// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const JUTEC_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('JUTEC', 'ジューテック', fileName);
};

export const JUTEC_COMPANY_INFO = {
  companyId: 'JUTEC',
  companyName: 'ジューテック',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['ジューテック固有のPDF形式に対応予定']
} as const;