// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const KATOUBENIYA_ASAGIRI_TAMURA_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('KATOUBENIYA_ASAGIRI_TAMURA', '加藤ベニヤ朝霧_タムラ建設', fileName);
};

export const KATOUBENIYA_ASAGIRI_TAMURA_COMPANY_INFO = {
  companyId: 'KATOUBENIYA_ASAGIRI_TAMURA',
  companyName: '加藤ベニヤ朝霧_タムラ建設',
  parentCompany: '加藤ベニヤ朝霧',
  subCompany: 'タムラ建設',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['加藤ベニヤ朝霧_タムラ建設固有のPDF形式に対応予定']
} as const;