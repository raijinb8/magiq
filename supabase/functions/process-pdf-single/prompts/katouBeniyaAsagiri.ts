// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const KATOUBENIYA_ASAGIRI_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('KATOUBENIYA_ASAGIRI', '加藤ベニヤ朝霧', fileName);
};

export const KATOUBENIYA_ASAGIRI_COMPANY_INFO = {
  companyId: 'KATOUBENIYA_ASAGIRI',
  companyName: '加藤ベニヤ朝霧',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['加藤ベニヤ朝霧固有のPDF形式に対応予定']
} as const;