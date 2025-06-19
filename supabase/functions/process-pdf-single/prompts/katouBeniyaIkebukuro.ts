// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const KATOUBENIYA_IKEBUKURO_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('KATOUBENIYA_IKEBUKURO', '加藤ベニヤ池袋', fileName);
};

export const KATOUBENIYA_IKEBUKURO_COMPANY_INFO = {
  companyId: 'KATOUBENIYA_IKEBUKURO',
  companyName: '加藤ベニヤ池袋',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['加藤ベニヤ池袋固有のPDF形式に対応予定']
} as const;