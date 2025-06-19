// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const KATOUBENIYA_ASAGIRI_AIDA_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('KATOUBENIYA_ASAGIRI_AIDA', '加藤ベニヤ朝霧_アイダ設計', fileName);
};

export const KATOUBENIYA_ASAGIRI_AIDA_COMPANY_INFO = {
  companyId: 'KATOUBENIYA_ASAGIRI_AIDA',
  companyName: '加藤ベニヤ朝霧_アイダ設計',
  parentCompany: '加藤ベニヤ朝霧',
  subCompany: 'アイダ設計',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['加藤ベニヤ朝霧_アイダ設計固有のPDF形式に対応予定']
} as const;