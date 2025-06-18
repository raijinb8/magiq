// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const WATANABE_JONANSHIMA_TOYOTA_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('WATANABE_JONANSHIMA_TOYOTA', '渡辺ベニヤ城南島_トヨタホーム', fileName);
};

export const WATANABE_JONANSHIMA_TOYOTA_COMPANY_INFO = {
  companyId: 'WATANABE_JONANSHIMA_TOYOTA',
  companyName: '渡辺ベニヤ城南島_トヨタホーム',
  parentCompany: '渡辺ベニヤ城南島',
  subCompany: 'トヨタホーム',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['渡辺ベニヤ城南島_トヨタホーム固有のPDF形式に対応予定']
} as const;