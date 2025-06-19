// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from '../common/promptTemplate.ts';

export const NOHARA_G_ISHO_PROMPT = (fileName: string): string => {
  return createPlaceholderPrompt('NOHARA_G_ISHO', '野原G住環境_井笑ホーム', fileName);
};

export const NOHARA_G_ISHO_COMPANY_INFO = {
  companyId: 'NOHARA_G_ISHO',
  companyName: '野原G住環境_井笑ホーム',
  parentCompany: '野原G住環境',
  subCompany: '井笑ホーム',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: ['野原G住環境_井笑ホーム固有のPDF形式に対応予定']
} as const;