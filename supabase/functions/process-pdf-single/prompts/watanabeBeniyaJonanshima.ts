// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const WATANABE_BENIYA_JONANSHIMA_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('WATANABE_BENIYA_JONANSHIMA', '渡辺ベニヤ城南島', fileName);
};

export const WATANABE_BENIYA_JONANSHIMA_COMPANY_INFO = {
  companyId: 'WATANABE_BENIYA_JONANSHIMA',
  companyName: '渡辺ベニヤ城南島',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['渡辺ベニヤ城南島固有のPDF形式に対応予定']
} as const;