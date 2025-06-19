// バージョン履歴:
// V20250610: 初版作成（プレースホルダー実装）
import { createPlaceholderPrompt } from './common/promptTemplate.ts';

export const SONOTA_PROMPT = (fileName: string): string => {
  // プレースホルダー実装：実際のプロンプトは会社固有要件に応じてカスタマイズが必要
  return createPlaceholderPrompt('SONOTA', 'その他', fileName);
};

// 会社固有情報（実装時参考用）
export const SONOTA_COMPANY_INFO = {
  companyId: 'SONOTA',
  companyName: 'その他',
  version: 'V20250610',
  implementationStatus: 'placeholder',
  notes: [
    '汎用的な処理を想定',
    '特定の会社に該当しない案件用',
    '実際の使用時には個別のルールを適用する可能性がある'
  ]
} as const;