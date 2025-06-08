// @google/genai パッケージのモック実装
// テスト環境でこのファイルをインポートマップで置き換えることで、
// 実際のGemini APIの代わりにモックを使用できます

import {
  createMockGeminiAI,
  GEMINI_MOCK_RESPONSES,
  MockGoogleGenAI,
} from '../test-helpers/gemini-mock.ts'

// グローバルなモックインスタンス
let globalMockInstance: MockGoogleGenAI | null = null

/**
 * GoogleGenAI クラスのモック
 * 実際の @google/genai パッケージと同じインターフェースを提供
 */
export class GoogleGenAI {
  private mockInstance: MockGoogleGenAI

  constructor({ apiKey }: { apiKey: string }) {
    // グローバルインスタンスがあれば使用、なければ新規作成
    if (globalMockInstance) {
      this.mockInstance = globalMockInstance
    } else {
      this.mockInstance = createMockGeminiAI(apiKey)
      globalMockInstance = this.mockInstance
    }
  }

  get models() {
    return this.mockInstance.models
  }
}

/**
 * テスト用のヘルパー関数
 * モックの動作をカスタマイズするために使用
 */
export function configureMockGeminiAI(
  configFn: (mock: MockGoogleGenAI) => void,
): void {
  if (!globalMockInstance) {
    globalMockInstance = createMockGeminiAI()
  }
  configFn(globalMockInstance)
}

/**
 * モックをリセット
 */
export function resetMockGeminiAI(): void {
  if (globalMockInstance) {
    globalMockInstance.reset()
    globalMockInstance = null
  }
}

/**
 * プリセットレスポンスをエクスポート
 */
export { GEMINI_MOCK_RESPONSES }

// 型定義をエクスポート（実際のパッケージとの互換性のため）
export interface GenerateContentRequest {
  model: string
  contents: Content[]
  systemInstruction?: string
  safetySettings?: SafetySetting[]
}

export interface Content {
  role: 'user' | 'model'
  parts: Part[]
}

export interface Part {
  text?: string
  inlineData?: {
    mimeType: string
    data: string
  }
}

export interface SafetySetting {
  category: string
  threshold: string
}

export interface GenerateContentResponse {
  text: string
  usageMetadata?: {
    promptTokenCount?: number
    candidatesTokenCount?: number
    totalTokenCount?: number
    cachedContentTokenCount?: number
  }
}
