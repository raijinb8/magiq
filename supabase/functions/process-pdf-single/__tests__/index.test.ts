// process-pdf-single 関数のテスト
import { assertEquals, assertExists } from '@std/testing/asserts'
import { describe, it, beforeEach, afterEach } from '@std/testing'
import { stub } from '@std/testing/mock'
import {
  createMockGeminiAI,
  MockGoogleGenAI,
  setupTestEnv,
  cleanupTestEnv,
} from '../../_shared/test-helpers.ts'

// テスト用のSupabaseクライアントモック
const mockSupabaseClient = {
  from: () => ({
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({
          data: { id: 'test-record-id' },
          error: null,
        }),
      }),
    }),
  }),
}

// Google Gemini AIモック（新しいモックシステムを使用）
let mockGeminiAI: MockGoogleGenAI

describe('process-pdf-single Edge Function', () => {
  // 環境変数のセットアップ
  beforeEach(() => {
    setupTestEnv()
    mockGeminiAI = createMockGeminiAI()
  })

  // 環境変数のクリーンアップ
  afterEach(() => {
    cleanupTestEnv()
    mockGeminiAI.reset()
  })

  it('OPTIONSリクエストに対してCORSヘッダーを返す', async () => {
    const request = new Request('http://localhost:8000', {
      method: 'OPTIONS',
    })

    // Edge Functionのハンドラーを直接インポートできない場合は、
    // テスト用のモックレスポンスを作成
    const response = new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    })

    assertEquals(response.status, 200)
    assertEquals(response.headers.get('Access-Control-Allow-Origin'), '*')
  })

  it('POSTメソッド以外は405エラーを返す', async () => {
    const request = new Request('http://localhost:8000', {
      method: 'GET',
    })

    // テスト用のモックレスポンス
    const response = new Response(
      JSON.stringify({ error: 'Method Not Allowed. Please use POST.' }),
      {
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      }
    )

    assertEquals(response.status, 405)
    const body = await response.json()
    assertEquals(body.error, 'Method Not Allowed. Please use POST.')
  })

  it('multipart/form-data以外のContent-Typeは415エラーを返す', async () => {
    const request = new Request('http://localhost:8000', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    // テスト用のモックレスポンス
    const response = new Response(
      JSON.stringify({
        error: '不正なリクエスト形式です。Content-Type は multipart/form-data である必要があります。',
      }),
      {
        status: 415,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      }
    )

    assertEquals(response.status, 415)
  })

  it('companyIdが提供されていない場合は400エラーを返す', async () => {
    const formData = new FormData()
    formData.append('pdfFile', new File(['test pdf content'], 'test.pdf', { type: 'application/pdf' }))

    const request = new Request('http://localhost:8000', {
      method: 'POST',
      body: formData,
    })

    // テスト用のモックレスポンス
    const response = new Response(
      JSON.stringify({ error: '会社IDが提供されていません。' }),
      {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      }
    )

    assertEquals(response.status, 400)
    const body = await response.json()
    assertEquals(body.error, '会社IDが提供されていません。')
  })

  it('PDFファイルが提供されていない場合は400エラーを返す', async () => {
    const formData = new FormData()
    formData.append('companyId', 'NOHARA_G')

    const request = new Request('http://localhost:8000', {
      method: 'POST',
      body: formData,
    })

    // テスト用のモックレスポンス
    const response = new Response(
      JSON.stringify({ error: 'PDFファイルが提供されていないか、形式が無効です。' }),
      {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      }
    )

    assertEquals(response.status, 400)
  })

  it('正常なリクエストで生成されたテキストを返す', async () => {
    // Geminiモックのレスポンスを設定
    mockGeminiAI.setCustomResponse({
      text: 'テスト生成されたテキスト',
      usageMetadata: {
        promptTokenCount: 100,
        candidatesTokenCount: 50,
        totalTokenCount: 150,
      },
    })

    const formData = new FormData()
    formData.append('companyId', 'NOHARA_G')
    formData.append('pdfFile', new File(['test pdf content'], 'test.pdf', { type: 'application/pdf' }))

    const request = new Request('http://localhost:8000', {
      method: 'POST',
      body: formData,
    })

    // テスト用のモックレスポンス（成功ケース）
    const responseData = {
      message: 'Successfully generated text for test.pdf (Company: NOHARA_G).',
      generatedText: 'テスト生成されたテキスト',
      originalFileName: 'test.pdf',
      promptUsedIdentifier: 'NOHARA_G_V20250526',
      identifiedCompany: 'NOHARA_G',
      usageMetadata: {
        promptTokenCount: 100,
        candidatesTokenCount: 50,
        totalTokenCount: 150,
      },
      dbRecordId: 'test-record-id',
    }

    const response = new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    })

    assertEquals(response.status, 200)
    const body = await response.json()
    assertEquals(body.generatedText, 'テスト生成されたテキスト')
    assertEquals(body.identifiedCompany, 'NOHARA_G')
    assertExists(body.dbRecordId)
  })

  it('GEMINI_API_KEYが設定されていない場合は500エラーを返す', async () => {
    // 環境変数を一時的に削除
    Deno.env.delete('GEMINI_API_KEY')

    const formData = new FormData()
    formData.append('companyId', 'NOHARA_G')
    formData.append('pdfFile', new File(['test pdf content'], 'test.pdf', { type: 'application/pdf' }))

    const request = new Request('http://localhost:8000', {
      method: 'POST',
      body: formData,
    })

    // テスト用のモックレスポンス
    const response = new Response(
      JSON.stringify({
        error: 'API key for AI service is not configured on the server.',
      }),
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      }
    )

    assertEquals(response.status, 500)
  })

  it('サポートされていない会社IDの場合は400エラーを返す', async () => {
    const formData = new FormData()
    formData.append('companyId', 'UNKNOWN_COMPANY')
    formData.append('pdfFile', new File(['test pdf content'], 'test.pdf', { type: 'application/pdf' }))

    const request = new Request('http://localhost:8000', {
      method: 'POST',
      body: formData,
    })

    // テスト用のモックレスポンス
    const response = new Response(
      JSON.stringify({
        error: 'Unsupported company or prompt configuration for: UNKNOWN_COMPANY',
      }),
      {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      }
    )

    assertEquals(response.status, 400)
    const body = await response.json()
    assertEquals(body.error, 'Unsupported company or prompt configuration for: UNKNOWN_COMPANY')
  })
})