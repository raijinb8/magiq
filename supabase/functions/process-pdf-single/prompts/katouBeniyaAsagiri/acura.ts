// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const KATOUBENIYA_ASAGIRI_ACURA_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('KATOUBENIYA_ASAGIRI_ACURA', '加藤ベニヤ朝霧_アキュラホーム', fileName);
};

export const KATOUBENIYA_ASAGIRI_ACURA_COMPANY_INFO = {
  companyId: 'KATOUBENIYA_ASAGIRI_ACURA',
  companyName: '加藤ベニヤ朝霧_アキュラホーム',
  parentCompany: '加藤ベニヤ朝霧',
  subCompany: 'アキュラホーム',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['加藤ベニヤ朝霧_アキュラホーム固有のPDF形式に対応予定']
} as const;