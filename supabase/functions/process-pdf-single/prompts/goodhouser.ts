// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const GOODHOUSER_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('GOODHOUSER', 'グッドハウザー', fileName);
};

export const GOODHOUSER_COMPANY_INFO = {
  companyId: 'GOODHOUSER',
  companyName: 'グッドハウザー',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['グッドハウザー固有のPDF形式に対応予定']
} as const;