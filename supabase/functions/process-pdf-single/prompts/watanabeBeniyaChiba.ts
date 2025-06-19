// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const WATANABE_BENIYA_CHIBA_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('WATANABE_BENIYA_CHIBA', '渡辺ベニヤ千葉', fileName);
};

export const WATANABE_BENIYA_CHIBA_COMPANY_INFO = {
  companyId: 'WATANABE_BENIYA_CHIBA',
  companyName: '渡辺ベニヤ千葉',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['渡辺ベニヤ千葉固有のPDF形式に対応予定']
} as const;