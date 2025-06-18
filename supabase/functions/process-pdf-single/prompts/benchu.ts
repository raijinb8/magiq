// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const BENCHU_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('BENCHU', '紅中', fileName);
};

export const BENCHU_COMPANY_INFO = {
  companyId: 'BENCHU',
  companyName: '紅中',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['紅中固有のPDF形式に対応予定']
} as const;