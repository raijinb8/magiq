// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const JUTEC_CAREN_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('JUTEC_CAREN', 'ジューテック_カレンエステート', fileName);
};

export const JUTEC_CAREN_COMPANY_INFO = {
  companyId: 'JUTEC_CAREN',
  companyName: 'ジューテック_カレンエステート',
  parentCompany: 'ジューテック',
  subCompany: 'カレンエステート',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['ジューテック_カレンエステート固有のPDF形式に対応予定']
} as const;