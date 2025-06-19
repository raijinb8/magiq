// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const JAPAN_KENZAI_ECOHOUSE_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('JAPAN_KENZAI_ECOHOUSE', 'ジャパン建材_エコハウス', fileName);
};

export const JAPAN_KENZAI_ECOHOUSE_COMPANY_INFO = {
  companyId: 'JAPAN_KENZAI_ECOHOUSE',
  companyName: 'ジャパン建材_エコハウス',
  parentCompany: 'ジャパン建材',
  subCompany: 'エコハウス',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['ジャパン建材_エコハウス固有のPDF形式に対応予定']
} as const;