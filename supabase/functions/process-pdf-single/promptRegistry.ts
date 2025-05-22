// supabase/functions/process-pdf-single/promptRegistry.ts
// フロントエンドから送られてくる会社ID（例: NOHARA_G_）と、
// 実際に呼び出すべきプロンプト関数（またはそのファイルパス）を
// 対応付ける「マッピング情報」
import { NOHARA_G_PROMPT as NOHARA_G_PROMPT_FUNC } from './prompts/noharaG.ts'
import { KATOUBENIYA_MISAWA_PROMPT as KATOUBENIYA_MISAWA_PROMPT_FUNC } from './prompts/katouBeniyaIkebukuro/misawa.ts'
// ... 他のプロンプト関数をインポート

// プロンプト関数の型定義 (一貫性を保つため)
export type PromptFunction = (fileName: string, pdfContent: string) => string

interface PromptRegistryEntry {
  filePathForLogging?: string // デバッグやログ出力用 (動的インポートを使わない場合は主にこれ)
  promptFunction: PromptFunction
  version: string // プロンプトのバージョン
}

// フロントエンドから送られてくる companyId (またはそれを処理して得られるキー) とプロンプトの対応表
export const PROMPT_REGISTRY: Record<string, PromptRegistryEntry | undefined> = {
  NOHARA_G: {
    // このキーはフロントエンドと合わせるか、フロントからの情報で生成
    filePathForLogging: './prompts/noharaG.ts', // 例
    promptFunction: NOHARA_G_PROMPT_FUNC,
    version: 'V20250519',
  },
  KATOUBENIYA_MISAWA: {
    filePathForLogging: './prompts/katouBeniyaIkebukuro/misawa.ts',
    promptFunction: KATOUBENIYA_MISAWA_PROMPT_FUNC,
    version: 'V20250519',
  },
  // 新しい会社・発注元のプロンプトを追加する場合、ここに追記し、関数をインポートする
}

// 会社IDからプロンプト関数を取得するヘルパー関数
// 型安全性を高めるために
// キーが文字列で、値が PromptRegistryEntry 型または undefined (見つからない場合があるため)
export function getPrompt(companyId: string): PromptRegistryEntry | null {
  const entry = PROMPT_REGISTRY[companyId]
  if (entry) {
    return entry
  }
  console.warn(`No prompt found in registry for companyId: ${companyId}`)
  return null
}
