// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const NOHARA_G_YOSHINO_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('NOHARA_G_YOSHINO', '野原G住環境_株式会社ヨシノ', fileName);
};

export const NOHARA_G_YOSHINO_COMPANY_INFO = {
  companyId: 'NOHARA_G_YOSHINO',
  companyName: '野原G住環境_株式会社ヨシノ',
  parentCompany: '野原G住環境',
  subCompany: '株式会社ヨシノ',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['野原G住環境_株式会社ヨシノ固有のPDF形式に対応予定']
} as const;