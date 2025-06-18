// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const JUTEC_FSTAGE_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('JUTEC_FSTAGE', 'ジューテック_エフステージ', fileName);
};

export const JUTEC_FSTAGE_COMPANY_INFO = {
  companyId: 'JUTEC_FSTAGE',
  companyName: 'ジューテック_エフステージ',
  parentCompany: 'ジューテック',
  subCompany: 'エフステージ',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['ジューテック_エフステージ固有のPDF形式に対応予定']
} as const;