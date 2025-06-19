// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const NOHARA_G_TAMAC_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('NOHARA_G_TAMAC', '野原G住環境_タマック', fileName);
};

export const NOHARA_G_TAMAC_COMPANY_INFO = {
  companyId: 'NOHARA_G_TAMAC',
  companyName: '野原G住環境_タマック',
  parentCompany: '野原G住環境',
  subCompany: 'タマック',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['野原G住環境_タマック固有のPDF形式に対応予定']
} as const;