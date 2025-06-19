// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const NOHARA_G_BUSHU_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('NOHARA_G_BUSHU', '野原G住環境_武州建設', fileName);
};

export const NOHARA_G_BUSHU_COMPANY_INFO = {
  companyId: 'NOHARA_G_BUSHU',
  companyName: '野原G住環境_武州建設',
  parentCompany: '野原G住環境',
  subCompany: '武州建設',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['野原G住環境_武州建設固有のPDF形式に対応予定']
} as const;