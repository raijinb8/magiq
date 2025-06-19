// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const ITO_KENSETSU_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('ITO_KENSETSU', '伊藤建設', fileName);
};

export const ITO_KENSETSU_COMPANY_INFO = {
  companyId: 'ITO_KENSETSU',
  companyName: '伊藤建設',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['伊藤建設固有のPDF形式に対応予定']
} as const;