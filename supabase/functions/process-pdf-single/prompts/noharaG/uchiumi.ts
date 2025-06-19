// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const NOHARA_G_UCHIUMI_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('NOHARA_G_UCHIUMI', '野原G住環境_内海工務店', fileName);
};

export const NOHARA_G_UCHIUMI_COMPANY_INFO = {
  companyId: 'NOHARA_G_UCHIUMI',
  companyName: '野原G住環境_内海工務店',
  parentCompany: '野原G住環境',
  subCompany: '内海工務店',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['野原G住環境_内海工務店固有のPDF形式に対応予定']
} as const;