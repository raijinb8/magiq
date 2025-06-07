// Gemini APIモックを使用したEdge Function統合テストのデモンストレーション
import { assertEquals, assertExists } from '@std/testing/asserts'
import { describe, it, beforeEach, afterEach } from '@std/testing/mod'
import {
  setupTestEnv,
  cleanupTestEnv,
  createMockGeminiAI,
  createTrackingMockGeminiAI,
  GEMINI_MOCK_RESPONSES,
  MockGoogleGenAI,
} from '../../_shared/test-helpers.ts'

describe('Gemini API モック統合デモ', () => {
  let mockGeminiAI: MockGoogleGenAI

  beforeEach(() => {
    setupTestEnv()
  })

  afterEach(() => {
    cleanupTestEnv()
    if (mockGeminiAI) {
      mockGeminiAI.reset()
    }
  })

  describe('基本的なモック使用例', () => {
    it('シンプルなレスポンスのモック', async () => {
      mockGeminiAI = createMockGeminiAI()
      
      // カスタムレスポンスを設定
      mockGeminiAI.setCustomResponse({
        text: 'カスタムレスポンステキスト',
        usageMetadata: {
          promptTokenCount: 200,
          candidatesTokenCount: 100,
          totalTokenCount: 300,
        },
      })

      // APIを呼び出し
      const response = await mockGeminiAI.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: [{ role: 'user', parts: [{ text: 'テストプロンプト' }] }],
      })

      assertEquals(response.text, 'カスタムレスポンステキスト')
      assertEquals(response.usageMetadata?.totalTokenCount, 300)
    })

    it('エラーケースのモック', async () => {
      mockGeminiAI = createMockGeminiAI()
      
      // エラーレスポンスを設定
      mockGeminiAI.setErrorResponse(new Error('Rate limit exceeded'))

      try {
        await mockGeminiAI.models.generateContent({
          model: 'gemini-2.5-flash-preview-04-17',
          contents: [{ role: 'user', parts: [{ text: 'テストプロンプト' }] }],
        })
        throw new Error('エラーが発生するはずでした')
      } catch (error) {
        assertEquals((error as Error).message, 'Rate limit exceeded')
      }
    })
  })

  describe('会社別レスポンスのモック', () => {
    it('NOHARA_G用のレスポンス', async () => {
      mockGeminiAI = createMockGeminiAI()
      
      // 条件付きレスポンスを設定
      mockGeminiAI.setConditionalResponse(
        (request) => {
          const requestStr = JSON.stringify(request)
          return requestStr.includes('NOHARA_G') || requestStr.includes('野原')
        },
        GEMINI_MOCK_RESPONSES.NOHARA_G
      )

      // 野原G用のリクエスト
      const response = await mockGeminiAI.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: [{
          role: 'user',
          parts: [
            { text: 'NOHARA_G用のプロンプト' },
            { inlineData: { mimeType: 'application/pdf', data: 'base64data' } },
          ],
        }],
      })

      assertEquals(response.text.includes('野原産業(株)東京ブロック'), true)
      assertEquals(response.usageMetadata?.promptTokenCount, 2500)
    })

    it('KATOUBENIYA_MISAWA用のレスポンス', async () => {
      mockGeminiAI = createMockGeminiAI()
      
      // プリセットレスポンスを使用
      mockGeminiAI.setCustomResponse(GEMINI_MOCK_RESPONSES.KATOUBENIYA_MISAWA)

      const response = await mockGeminiAI.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: [{
          role: 'user',
          parts: [
            { text: 'ミサワホーム用のプロンプト' },
            { inlineData: { mimeType: 'application/pdf', data: 'base64data' } },
          ],
        }],
      })

      assertEquals(response.text.includes('ミサワホーム(株)'), true)
      assertEquals(response.text.includes('渋谷区神宮前５丁目新築工事'), true)
    })
  })

  describe('API呼び出しのトラッキング', () => {
    it('API呼び出し回数とリクエスト内容の追跡', async () => {
      const trackingMock = createTrackingMockGeminiAI()
      
      // 複数回のAPI呼び出し
      const requests = [
        { text: '1回目のリクエスト' },
        { text: '2回目のリクエスト' },
        { text: '3回目のリクエスト' },
      ]

      for (const [index, request] of requests.entries()) {
        await trackingMock.models.generateContent({
          model: 'gemini-2.5-flash-preview-04-17',
          contents: [{ role: 'user', parts: [request] }],
        })
        
        assertEquals(trackingMock.callCount, index + 1)
      }

      // 最後のリクエストが記録されていることを確認
      assertEquals(trackingMock.lastRequest.contents[0].parts[0].text, '3回目のリクエスト')
      
      // リセット機能の確認
      trackingMock.resetTracking()
      assertEquals(trackingMock.callCount, 0)
      assertEquals(trackingMock.lastRequest, null)
    })
  })

  describe('実際のEdge Function処理フローのシミュレーション', () => {
    it('PDFアップロードから結果保存までの完全なフロー', async () => {
      mockGeminiAI = createMockGeminiAI()
      
      // PDFファイルの準備
      const pdfContent = 'test pdf content'
      const pdfBase64 = btoa(pdfContent) // 実際のBase64エンコード

      // 会社IDに基づいて異なるレスポンスを返す
      mockGeminiAI.setConditionalResponse(
        (request) => {
          const parts = request.contents[0].parts
          const textPart = parts.find((p: any) => p.text)
          return textPart?.text.includes('野原G_20250601.pdf')
        },
        {
          text: `【取引先_発注元】野原産業(株)東京ブロック
【工事名】テストプロジェクト
【納期】２０２５年７月１０日
【備考・注意事項】モックテスト用のレスポンス`,
          usageMetadata: {
            promptTokenCount: 1234,
            candidatesTokenCount: 567,
            totalTokenCount: 1801,
          },
        }
      )

      // Gemini APIを呼び出し
      const response = await mockGeminiAI.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: [{
          role: 'user',
          parts: [
            { text: '以下のPDFファイル「野原G_20250601.pdf」から情報を抽出してください。' },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: pdfBase64,
              },
            },
          ],
        }],
      })

      // 結果の検証
      assertExists(response.text)
      assertEquals(response.text.includes('野原産業(株)東京ブロック'), true)
      assertEquals(response.usageMetadata?.totalTokenCount, 1801)

      // データベース保存のシミュレーション（実際のテストでは mockSupabaseClient を使用）
      const dbRecord = {
        id: 'generated-uuid',
        file_name: '野原G_20250601.pdf',
        generated_text: response.text,
        company_name: '野原産業(株)東京ブロック',
        prompt_identifier: 'NOHARA_G_V20250526',
        status: 'completed_from_ai',
        gemini_processed_at: new Date().toISOString(),
        usageMetadata: response.usageMetadata,
      }

      assertExists(dbRecord.id)
      assertEquals(dbRecord.status, 'completed_from_ai')
    })
  })

  describe('高度なモック機能', () => {
    it('複数の条件に基づく動的レスポンス', async () => {
      mockGeminiAI = createMockGeminiAI()
      
      // 複雑な条件ロジック
      mockGeminiAI.setConditionalResponse(
        (request) => {
          const parts = request.contents[0].parts
          const hasFile = parts.some((p: any) => p.inlineData)
          const textContent = parts.find((p: any) => p.text)?.text || ''
          
          // ファイルがあり、かつ特定のキーワードを含む場合
          return hasFile && textContent.includes('urgent')
        },
        {
          text: '緊急対応が必要な案件です',
          usageMetadata: { totalTokenCount: 999 },
        }
      )

      // 条件に一致しないケース
      const normalResponse = await mockGeminiAI.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: [{ role: 'user', parts: [{ text: 'normal request' }] }],
      })
      assertEquals(normalResponse.text, 'モック生成されたテキスト')

      // 条件に一致するケース
      const urgentResponse = await mockGeminiAI.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: [{
          role: 'user',
          parts: [
            { text: 'urgent: process this file immediately' },
            { inlineData: { mimeType: 'application/pdf', data: 'base64' } },
          ],
        }],
      })
      assertEquals(urgentResponse.text, '緊急対応が必要な案件です')
    })

    it('トークン使用量に基づくコスト計算のシミュレーション', async () => {
      const trackingMock = createTrackingMockGeminiAI()
      
      // 異なるトークン使用量のレスポンスを設定
      const responses = [
        { promptTokens: 1000, outputTokens: 200 },
        { promptTokens: 2000, outputTokens: 300 },
        { promptTokens: 1500, outputTokens: 250 },
      ]

      let totalPromptTokens = 0
      let totalOutputTokens = 0

      for (const { promptTokens, outputTokens } of responses) {
        trackingMock.setCustomResponse({
          text: `Response with ${promptTokens} prompt tokens`,
          usageMetadata: {
            promptTokenCount: promptTokens,
            candidatesTokenCount: outputTokens,
            totalTokenCount: promptTokens + outputTokens,
          },
        })

        const response = await trackingMock.models.generateContent({
          model: 'gemini-2.5-flash-preview-04-17',
          contents: [{ role: 'user', parts: [{ text: 'test' }] }],
        })

        totalPromptTokens += response.usageMetadata?.promptTokenCount || 0
        totalOutputTokens += response.usageMetadata?.candidatesTokenCount || 0
      }

      // トータルトークン使用量の検証
      assertEquals(totalPromptTokens, 4500)
      assertEquals(totalOutputTokens, 750)
      assertEquals(trackingMock.callCount, 3)
    })
  })
})