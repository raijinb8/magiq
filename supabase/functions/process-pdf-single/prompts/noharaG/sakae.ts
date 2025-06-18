// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const NOHARA_G_SAKAE_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('NOHARA_G_SAKAE', '野原G住環境_栄工務店', fileName);
};

export const NOHARA_G_SAKAE_COMPANY_INFO = {
  companyId: 'NOHARA_G_SAKAE',
  companyName: '野原G住環境_栄工務店',
  parentCompany: '野原G住環境',
  subCompany: '栄工務店',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['野原G住環境_栄工務店固有のPDF形式に対応予定']
} as const;