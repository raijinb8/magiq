// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const JAPAN_KENZAI_APPLEHOME_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('JAPAN_KENZAI_APPLEHOME', 'ジャパン建材_アップルホーム', fileName);
};

export const JAPAN_KENZAI_APPLEHOME_COMPANY_INFO = {
  companyId: 'JAPAN_KENZAI_APPLEHOME',
  companyName: 'ジャパン建材_アップルホーム',
  parentCompany: 'ジャパン建材',
  subCompany: 'アップルホーム',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['ジャパン建材_アップルホーム固有のPDF形式に対応予定']
} as const;