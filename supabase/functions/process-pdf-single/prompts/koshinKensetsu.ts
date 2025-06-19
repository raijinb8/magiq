// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const KOSHIN_KENSETSU_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('KOSHIN_KENSETSU', '公進建設', fileName);
};

export const KOSHIN_KENSETSU_COMPANY_INFO = {
  companyId: 'KOSHIN_KENSETSU',
  companyName: '公進建設',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['公進建設固有のPDF形式に対応予定']
} as const;