// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const KATOUBENIYA_ASAGIRI_DAIWA_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('KATOUBENIYA_ASAGIRI_DAIWA', '加藤ベニヤ朝霧_大和ハウス', fileName);
};

export const KATOUBENIYA_ASAGIRI_DAIWA_COMPANY_INFO = {
  companyId: 'KATOUBENIYA_ASAGIRI_DAIWA',
  companyName: '加藤ベニヤ朝霧_大和ハウス',
  parentCompany: '加藤ベニヤ朝霧',
  subCompany: '大和ハウス',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['加藤ベニヤ朝霧_大和ハウス固有のPDF形式に対応予定']
} as const;