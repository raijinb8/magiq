// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const YUTAKA_KENSETSU_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('YUTAKA_KENSETSU', 'ユタカ建設', fileName);
};

export const YUTAKA_KENSETSU_COMPANY_INFO = {
  companyId: 'YUTAKA_KENSETSU',
  companyName: 'ユタカ建設',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['ユタカ建設固有のPDF形式に対応予定']
} as const;