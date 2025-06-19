// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const TOWA_KENKO_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('TOWA_KENKO', 'トーア建工', fileName);
};

export const TOWA_KENKO_COMPANY_INFO = {
  companyId: 'TOWA_KENKO',
  companyName: 'トーア建工',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['トーア建工固有のPDF形式に対応予定']
} as const;