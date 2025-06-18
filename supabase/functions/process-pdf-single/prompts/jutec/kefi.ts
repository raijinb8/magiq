// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const JUTEC_KEFI_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('JUTEC_KEFI', 'ジューテック_KEFI WORKS', fileName);
};

export const JUTEC_KEFI_COMPANY_INFO = {
  companyId: 'JUTEC_KEFI',
  companyName: 'ジューテック_KEFI WORKS',
  parentCompany: 'ジューテック',
  subCompany: 'KEFI WORKS',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['ジューテック_KEFI WORKS固有のPDF形式に対応予定']
} as const;