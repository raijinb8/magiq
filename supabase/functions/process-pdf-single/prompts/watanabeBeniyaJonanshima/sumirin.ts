// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const WATANABE_JONANSHIMA_SUMIRIN_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('WATANABE_JONANSHIMA_SUMIRIN', '渡辺ベニヤ城南島_住友林業', fileName);
};

export const WATANABE_JONANSHIMA_SUMIRIN_COMPANY_INFO = {
  companyId: 'WATANABE_JONANSHIMA_SUMIRIN',
  companyName: '渡辺ベニヤ城南島_住友林業',
  parentCompany: '渡辺ベニヤ城南島',
  subCompany: '住友林業',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['渡辺ベニヤ城南島_住友林業固有のPDF形式に対応予定']
} as const;