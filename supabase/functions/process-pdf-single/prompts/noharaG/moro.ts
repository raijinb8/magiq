// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const NOHARA_G_MORO_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('NOHARA_G_MORO', '野原G住環境_茂呂建設', fileName);
};

export const NOHARA_G_MORO_COMPANY_INFO = {
  companyId: 'NOHARA_G_MORO',
  companyName: '野原G住環境_茂呂建設',
  parentCompany: '野原G住環境',
  subCompany: '茂呂建設',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['野原G住環境_茂呂建設固有のPDF形式に対応予定']
} as const;