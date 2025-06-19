// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const NOHARA_G_YAMATO_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('NOHARA_G_YAMATO', '野原G住環境_ヤマト住建', fileName);
};

export const NOHARA_G_YAMATO_COMPANY_INFO = {
  companyId: 'NOHARA_G_YAMATO',
  companyName: '野原G住環境_ヤマト住建',
  parentCompany: '野原G住環境',
  subCompany: 'ヤマト住建',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['野原G住環境_ヤマト住建固有のPDF形式に対応予定']
} as const;