// Gemini API用のモック実装
import { Stub, stub } from '@std/testing/mock'

/**
 * GoogleGenAI モデルのレスポンス型
 */
export interface MockGeminiResponse {
  text: string
  usageMetadata?: {
    promptTokenCount?: number
    candidatesTokenCount?: number
    totalTokenCount?: number
    cachedContentTokenCount?: number
  }
}

/**
 * GoogleGenAI のモック実装
 */
export class MockGoogleGenAI {
  private apiKey: string
  private generateContentStub: Stub | null = null
  private defaultResponse: MockGeminiResponse

  constructor({ apiKey }: { apiKey: string }) {
    this.apiKey = apiKey
    this.defaultResponse = {
      text: 'モック生成されたテキスト',
      usageMetadata: {
        promptTokenCount: 100,
        candidatesTokenCount: 50,
        totalTokenCount: 150,
      },
    }
  }

  /**
   * モデルインスタンスを取得
   */
  models = {
    generateContent: async (request: any): Promise<MockGeminiResponse> => {
      // APIキーが設定されていない場合のエラー
      if (!this.apiKey) {
        throw new Error('API key is required')
      }

      // モックレスポンスを返す
      if (this.generateContentStub) {
        return this.generateContentStub(request)
      }

      // デフォルトレスポンスを返す
      return this.defaultResponse
    },
  }

  /**
   * カスタムレスポンスを設定
   */
  setCustomResponse(response: MockGeminiResponse) {
    this.defaultResponse = response
  }

  /**
   * エラーレスポンスを設定
   */
  setErrorResponse(error: Error) {
    this.generateContentStub = stub(
      this.models,
      'generateContent',
      () => Promise.reject(error),
    )
  }

  /**
   * 特定のリクエストに対するレスポンスを設定
   */
  setConditionalResponse(
    condition: (request: any) => boolean,
    response: MockGeminiResponse | Error,
  ) {
    this.generateContentStub = stub(
      this.models,
      'generateContent',
      async (request: any) => {
        if (condition(request)) {
          if (response instanceof Error) {
            throw response
          }
          return response
        }
        return this.defaultResponse
      },
    )
  }

  /**
   * スタブをリセット
   */
  reset() {
    if (this.generateContentStub) {
      this.generateContentStub.restore()
      this.generateContentStub = null
    }
  }
}

/**
 * Gemini APIモックのファクトリー関数
 */
export function createMockGeminiAI(apiKey: string = 'test-api-key'): MockGoogleGenAI {
  return new MockGoogleGenAI({ apiKey })
}

/**
 * よく使うモックレスポンスのプリセット
 */
export const GEMINI_MOCK_RESPONSES = {
  // 野原G用のレスポンス
  NOHARA_G: {
    text: `【取引先_発注元】野原産業(株)東京ブロック

【工事名】(仮称)六本木一丁目計画

【物件名】(仮称)六本木一丁目計画

【納品場所】東京都港区六本木１－１－１

【納期】２０２５年７月１０日

【備考・注意事項】
・朝８時より作業開始
・搬入車両は４ｔ車まで
・必ず前日に確認の連絡を入れること`,
    usageMetadata: {
      promptTokenCount: 2500,
      candidatesTokenCount: 150,
      totalTokenCount: 2650,
    },
  },

  // ミサワホーム用のレスポンス
  KATOUBENIYA_IKEBUKURO_MISAWA: {
    text: `【取引先_発注元】ミサワホーム(株)

【工事名】渋谷区神宮前５丁目新築工事

【物件名】渋谷区神宮前５丁目新築工事

【納品場所】東京都渋谷区神宮前５－２５－３

【納期】２０２５年８月１５日

【備考・注意事項】
・納品時間：９時～１７時
・土曜日納品不可
・現場担当者：山田太郎`,
    usageMetadata: {
      promptTokenCount: 3000,
      candidatesTokenCount: 120,
      totalTokenCount: 3120,
    },
  },

  // エラーケース用
  ERROR_RATE_LIMIT: new Error('Gemini API rate limit exceeded'),
  ERROR_INVALID_PDF: new Error('Invalid PDF content'),
  ERROR_NETWORK: new Error('Network error connecting to Gemini API'),
}

/**
 * テスト用のヘルパー関数：特定の会社IDに応じたレスポンスを返すモック
 */
export function createCompanySpecificMock(): MockGoogleGenAI {
  const mock = createMockGeminiAI()

  mock.setConditionalResponse(
    (request) => {
      // リクエストの内容から会社IDを推測（実際の実装に合わせて調整）
      const requestText = JSON.stringify(request)
      if (requestText.includes('NOHARA_G')) {
        return true
      }
      return false
    },
    GEMINI_MOCK_RESPONSES.NOHARA_G,
  )

  return mock
}

/**
 * APIコール回数をトラッキングするモック
 */
export class TrackingMockGeminiAI extends MockGoogleGenAI {
  public callCount: number = 0
  public lastRequest: any = null

  constructor({ apiKey }: { apiKey: string }) {
    super({ apiKey })

    // generateContent をオーバーライド
    const originalGenerateContent = this.models.generateContent
    this.models.generateContent = async (request: any) => {
      this.callCount++
      this.lastRequest = request
      return originalGenerateContent.call(this.models, request)
    }
  }

  resetTracking() {
    this.callCount = 0
    this.lastRequest = null
  }
}

/**
 * トラッキング機能付きモックを作成
 */
export function createTrackingMockGeminiAI(apiKey: string = 'test-api-key'): TrackingMockGeminiAI {
  return new TrackingMockGeminiAI({ apiKey })
}
