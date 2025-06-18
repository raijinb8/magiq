// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const SAKAE_KENSETSU_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('SAKAE_KENSETSU', '栄建設', fileName);
};

export const SAKAE_KENSETSU_COMPANY_INFO = {
  companyId: 'SAKAE_KENSETSU',
  companyName: '栄建設',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['栄建設固有のPDF形式に対応予定']
} as const;