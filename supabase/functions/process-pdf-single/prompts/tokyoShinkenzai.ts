// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const TOKYO_SHINKENZAI_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('TOKYO_SHINKENZAI', '東京新建材社', fileName);
};

export const TOKYO_SHINKENZAI_COMPANY_INFO = {
  companyId: 'TOKYO_SHINKENZAI',
  companyName: '東京新建材社',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['東京新建材社固有のPDF形式に対応予定']
} as const;