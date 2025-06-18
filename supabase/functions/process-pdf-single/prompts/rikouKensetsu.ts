// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const RIKOU_KENSETSU_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('RIKOU_KENSETSU', '利幸建設', fileName);
};

export const RIKOU_KENSETSU_COMPANY_INFO = {
  companyId: 'RIKOU_KENSETSU',
  companyName: '利幸建設',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['利幸建設固有のPDF形式に対応予定']
} as const;