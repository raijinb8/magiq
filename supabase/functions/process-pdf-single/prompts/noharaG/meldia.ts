// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const NOHARA_G_MELDIA_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('NOHARA_G_MELDIA', '野原G住環境_メルディア', fileName);
};

export const NOHARA_G_MELDIA_COMPANY_INFO = {
  companyId: 'NOHARA_G_MELDIA',
  companyName: '野原G住環境_メルディア',
  parentCompany: '野原G住環境',
  subCompany: 'メルディア',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['野原G住環境_メルディア固有のPDF形式に対応予定']
} as const;