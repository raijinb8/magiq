// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const KATOUBENIYA_IKEBUKURO_HAWKONE_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('KATOUBENIYA_IKEBUKURO_HAWKONE', '加藤ベニヤ池袋_ホークワン', fileName);
};

export const KATOUBENIYA_IKEBUKURO_HAWKONE_COMPANY_INFO = {
  companyId: 'KATOUBENIYA_IKEBUKURO_HAWKONE',
  companyName: '加藤ベニヤ池袋_ホークワン',
  parentCompany: '加藤ベニヤ池袋',
  subCompany: 'ホークワン',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['加藤ベニヤ池袋_ホークワン固有のPDF形式に対応予定']
} as const;