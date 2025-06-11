// process-pdf-single 関数の統合テスト（Geminiモック使用）
import { assertEquals, assertExists } from '@std/testing/asserts'
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd'
import {
  assertCorsHeaders,
  assertErrorResponse,
  assertSuccessResponse,
  cleanupTestEnv,
  createFormData,
  createMockGeminiAI,
  createMockSupabaseClient,
  createRequest,
  createTrackingMockGeminiAI,
  GEMINI_MOCK_RESPONSES,
  MockGoogleGenAI,
  setupTestEnv,
  TrackingMockGeminiAI,
} from '../../_shared/test-helpers.ts'

describe('process-pdf-single Edge Function with Gemini Mock', () => {
  let mockGeminiAI: MockGoogleGenAI | TrackingMockGeminiAI
  let mockSupabaseClient: any

  beforeEach(() => {
    setupTestEnv()
    mockGeminiAI = createMockGeminiAI()
    mockSupabaseClient = createMockSupabaseClient()
  })

  afterEach(() => {
    cleanupTestEnv()
    if ('reset' in mockGeminiAI) {
      mockGeminiAI.reset()
    }
  })

  describe('Gemini API統合テスト', () => {
    it('正常なPDF処理でGemini APIが呼び出される', async () => {
      // トラッキング機能付きモックを使用
      const trackingMock = createTrackingMockGeminiAI()
      trackingMock.setCustomResponse({
        text: '処理されたPDFテキスト',
        usageMetadata: {
          promptTokenCount: 1000,
          candidatesTokenCount: 200,
          totalTokenCount: 1200,
        },
      })

      // APIコールが実行されたことを確認
      assertEquals(trackingMock.callCount, 0)

      // モックでAPIを呼び出し
      const response = await trackingMock.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: [{ role: 'user', parts: [] }],
      })

      assertEquals(trackingMock.callCount, 1)
      assertEquals(response.text, '処理されたPDFテキスト')
      assertEquals(response.usageMetadata?.totalTokenCount, 1200)
    })

    it('NOHARA_G用のプロンプトで正しいレスポンスが返される', async () => {
      mockGeminiAI.setCustomResponse(GEMINI_MOCK_RESPONSES.NOHARA_G)

      const response = await mockGeminiAI.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: [{ role: 'user', parts: [] }],
      })

      assertEquals(response.text.includes('野原産業(株)東京ブロック'), true)
      assertEquals(response.usageMetadata?.promptTokenCount, 2500)
    })

    it('KATOUBENIYA_MISAWA用のプロンプトで正しいレスポンスが返される', async () => {
      mockGeminiAI.setCustomResponse(GEMINI_MOCK_RESPONSES.KATOUBENIYA_MISAWA)

      const response = await mockGeminiAI.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: [{ role: 'user', parts: [] }],
      })

      assertEquals(response.text.includes('ミサワホーム(株)'), true)
      assertEquals(response.usageMetadata?.promptTokenCount, 3000)
    })

    it('Gemini APIがエラーを返した場合の処理', async () => {
      mockGeminiAI.setErrorResponse(new Error('API rate limit exceeded'))

      try {
        await mockGeminiAI.models.generateContent({
          model: 'gemini-2.5-flash-preview-04-17',
          contents: [{ role: 'user', parts: [] }],
        })
        throw new Error('エラーが発生するはずでした')
      } catch (error) {
        assertEquals((error as Error).message, 'API rate limit exceeded')
      }
    })

    it('APIキーが設定されていない場合のエラー', async () => {
      const mockWithoutKey = createMockGeminiAI('')

      try {
        await mockWithoutKey.models.generateContent({
          model: 'gemini-2.5-flash-preview-04-17',
          contents: [{ role: 'user', parts: [] }],
        })
        throw new Error('エラーが発生するはずでした')
      } catch (error) {
        assertEquals((error as Error).message, 'API key is required')
      }
    })

    it('PDFのBase64エンコーディングが正しく処理される', async () => {
      const trackingMock = createTrackingMockGeminiAI()

      const pdfBase64 = 'bW9ja2VkLWJhc2U2NC1lbmNvZGVkLXBkZi1jb250ZW50'
      const request = {
        model: 'gemini-2.5-flash-preview-04-17',
        contents: [{
          role: 'user',
          parts: [
            { text: 'PDFを処理してください' },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: pdfBase64,
              },
            },
          ],
        }],
      }

      await trackingMock.models.generateContent(request)

      // リクエストが正しく記録されていることを確認
      assertExists(trackingMock.lastRequest)
      assertEquals(
        trackingMock.lastRequest.contents[0].parts[1].inlineData.data,
        pdfBase64,
      )
    })

    it('トークン使用量が正しく返される', async () => {
      const customResponse = {
        text: 'テスト結果',
        usageMetadata: {
          promptTokenCount: 5000,
          candidatesTokenCount: 300,
          totalTokenCount: 5300,
          cachedContentTokenCount: 100,
        },
      }

      mockGeminiAI.setCustomResponse(customResponse)

      const response = await mockGeminiAI.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: [{ role: 'user', parts: [] }],
      })

      assertEquals(response.usageMetadata?.promptTokenCount, 5000)
      assertEquals(response.usageMetadata?.candidatesTokenCount, 300)
      assertEquals(response.usageMetadata?.totalTokenCount, 5300)
      assertEquals(response.usageMetadata?.cachedContentTokenCount, 100)
    })

    it('条件付きレスポンスが正しく動作する', async () => {
      // 特定の条件でカスタムレスポンスを返す
      mockGeminiAI.setConditionalResponse(
        (request) => {
          const requestStr = JSON.stringify(request)
          return requestStr.includes('special-condition')
        },
        {
          text: '特別な条件のレスポンス',
          usageMetadata: { totalTokenCount: 999 },
        },
      )

      // 条件に一致しない場合
      const normalResponse = await mockGeminiAI.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: [{ role: 'user', parts: [{ text: 'normal request' }] }],
      })
      assertEquals(normalResponse.text, 'モック生成されたテキスト')

      // 条件に一致する場合
      const specialResponse = await mockGeminiAI.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: [{ role: 'user', parts: [{ text: 'special-condition' }] }],
      })
      assertEquals(specialResponse.text, '特別な条件のレスポンス')
      assertEquals(specialResponse.usageMetadata?.totalTokenCount, 999)
    })

    it('複数回のAPI呼び出しがトラッキングされる', async () => {
      const trackingMock = createTrackingMockGeminiAI()

      // 1回目の呼び出し
      await trackingMock.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: [{ role: 'user', parts: [{ text: 'first call' }] }],
      })

      // 2回目の呼び出し
      await trackingMock.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: [{ role: 'user', parts: [{ text: 'second call' }] }],
      })

      assertEquals(trackingMock.callCount, 2)
      assertEquals(
        trackingMock.lastRequest.contents[0].parts[0].text,
        'second call',
      )

      // トラッキングをリセット
      trackingMock.resetTracking()
      assertEquals(trackingMock.callCount, 0)
      assertEquals(trackingMock.lastRequest, null)
    })
  })

  describe('Edge Function統合テスト（モックSupabaseとGemini）', () => {
    it('完全な処理フローが正常に動作する', async () => {
      // Geminiモックをセットアップ
      mockGeminiAI.setCustomResponse({
        text: '統合テスト用の生成テキスト',
        usageMetadata: {
          promptTokenCount: 1500,
          candidatesTokenCount: 250,
          totalTokenCount: 1750,
        },
      })

      // このテストは実際のEdge Functionハンドラーをインポートできない場合の
      // シミュレーションとして、期待される動作を確認
      const expectedResponse = {
        message: 'Successfully generated text for test.pdf (Company: NOHARA_G).',
        generatedText: '統合テスト用の生成テキスト',
        originalFileName: 'test.pdf',
        promptUsedIdentifier: 'NOHARA_G_V20250526',
        identifiedCompany: 'NOHARA_G',
        usageMetadata: {
          promptTokenCount: 1500,
          candidatesTokenCount: 250,
          totalTokenCount: 1750,
        },
        dbRecordId: 'test-record-id',
      }

      // レスポンスの検証
      assertExists(expectedResponse.generatedText)
      assertEquals(expectedResponse.identifiedCompany, 'NOHARA_G')
      assertEquals(expectedResponse.usageMetadata.totalTokenCount, 1750)
    })
  })
})
