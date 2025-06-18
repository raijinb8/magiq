// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const YAMAFUJI_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('YAMAFUJI', '株式会社山藤', fileName);
};

export const YAMAFUJI_COMPANY_INFO = {
  companyId: 'YAMAFUJI',
  companyName: '株式会社山藤',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['株式会社山藤固有のPDF形式に対応予定']
} as const;