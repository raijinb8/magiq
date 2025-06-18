// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const NOHARA_G_MISAWA_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('NOHARA_G_MISAWA', '野原G住環境_ミサワホーム', fileName);
};

export const NOHARA_G_MISAWA_COMPANY_INFO = {
  companyId: 'NOHARA_G_MISAWA',
  companyName: '野原G住環境_ミサワホーム',
  parentCompany: '野原G住環境',
  subCompany: 'ミサワホーム',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['野原G住環境_ミサワホーム固有のPDF形式に対応予定']
} as const;