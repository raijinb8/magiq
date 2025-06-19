// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const KATOUBENIYA_ASAGIRI_ASAHI_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('KATOUBENIYA_ASAGIRI_ASAHI', '加藤ベニヤ朝霧_旭ハウジング', fileName);
};

export const KATOUBENIYA_ASAGIRI_ASAHI_COMPANY_INFO = {
  companyId: 'KATOUBENIYA_ASAGIRI_ASAHI',
  companyName: '加藤ベニヤ朝霧_旭ハウジング',
  parentCompany: '加藤ベニヤ朝霧',
  subCompany: '旭ハウジング',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['加藤ベニヤ朝霧_旭ハウジング固有のPDF形式に対応予定']
} as const;