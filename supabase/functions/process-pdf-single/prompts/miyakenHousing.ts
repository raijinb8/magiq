// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const MIYAKEN_HOUSING_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('MIYAKEN_HOUSING', '宮建ハウジング', fileName);
};

export const MIYAKEN_HOUSING_COMPANY_INFO = {
  companyId: 'MIYAKEN_HOUSING',
  companyName: '宮建ハウジング',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['宮建ハウジング固有のPDF形式に対応予定']
} as const;