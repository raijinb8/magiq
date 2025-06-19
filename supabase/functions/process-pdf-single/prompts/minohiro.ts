// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const MINOHIRO_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('MINOHIRO', '美濃弘商店', fileName);
};

export const MINOHIRO_COMPANY_INFO = {
  companyId: 'MINOHIRO',
  companyName: '美濃弘商店',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['美濃弘商店固有のPDF形式に対応予定']
} as const;