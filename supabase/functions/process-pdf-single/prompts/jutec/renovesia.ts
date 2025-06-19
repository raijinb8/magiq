// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const JUTEC_RENOVESIA_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('JUTEC_RENOVESIA', 'ジューテック_リノベシア', fileName);
};

export const JUTEC_RENOVESIA_COMPANY_INFO = {
  companyId: 'JUTEC_RENOVESIA',
  companyName: 'ジューテック_リノベシア',
  parentCompany: 'ジューテック',
  subCompany: 'リノベシア',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['ジューテック_リノベシア固有のPDF形式に対応予定']
} as const;