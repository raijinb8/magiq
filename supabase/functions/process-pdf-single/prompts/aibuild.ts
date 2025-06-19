// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const AIBUILD_PROMPT = (fileName: string): string => {
  // プレースホルダー実装：実際のプロンプトは会社固有要件に応じてカスタマイズが必要
  return createPlaceholderPrompt('AIBUILD', 'アイビルド', fileName);
};

// 会社固有情報（実装時参考用）
export const AIBUILD_COMPANY_INFO = {
  companyId: 'AIBUILD',
  companyName: 'アイビルド',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: [
    'アイビルド固有のPDF形式に対応予定',
    '実際のプロンプトは会社固有のルールに基づいてカスタマイズが必要'
  ]
} as const;