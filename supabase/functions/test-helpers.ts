// Edge Functions用の共通テストヘルパー関数
import { stub } from '@std/testing/mock'

/**
 * FormDataを作成するヘルパー関数
 */
export function createFormData(
  companyId: string,
  pdfContent: string = 'test pdf content',
  fileName: string = 'test.pdf'
): FormData {
  const formData = new FormData()
  formData.append('companyId', companyId)
  formData.append(
    'pdfFile',
    new File([pdfContent], fileName, { type: 'application/pdf' })
  )
  return formData
}

/**
 * リクエストを作成するヘルパー関数
 */
export function createRequest(
  method: string = 'POST',
  body?: BodyInit,
  headers?: HeadersInit
): Request {
  return new Request('http://localhost:8000', {
    method,
    body,
    headers,
  })
}

/**
 * Supabaseクライアントのモックを作成
 */
export function createMockSupabaseClient(
  insertData: any = { id: 'test-record-id' },
  error: any = null
) {
  return {
    from: (table: string) => ({
      insert: (data: any[]) => ({
        select: (columns: string) => ({
          single: () => Promise.resolve({
            data: insertData,
            error,
          }),
        }),
      }),
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: insertData,
            error,
          }),
        }),
      }),
    }),
  }
}

/**
 * Google Gemini AIのレスポンスモックを作成
 */
export function createMockGeminiResponse(
  text: string = 'モック生成されたテキスト',
  usageMetadata?: any
) {
  return {
    text,
    usageMetadata: usageMetadata || {
      promptTokenCount: 100,
      candidatesTokenCount: 50,
      totalTokenCount: 150,
    },
  }
}

/**
 * 環境変数をセットアップするヘルパー関数
 */
export function setupTestEnv() {
  Deno.env.set('GEMINI_API_KEY', 'test-api-key')
  Deno.env.set('SUPABASE_URL', 'https://test.supabase.co')
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key')
}

/**
 * 環境変数をクリーンアップするヘルパー関数
 */
export function cleanupTestEnv() {
  Deno.env.delete('GEMINI_API_KEY')
  Deno.env.delete('SUPABASE_URL')
  Deno.env.delete('SUPABASE_SERVICE_ROLE_KEY')
}

/**
 * レスポンスヘッダーを検証するヘルパー関数
 */
export function assertCorsHeaders(response: Response) {
  const headers = response.headers
  if (headers.get('Access-Control-Allow-Origin') !== '*') {
    throw new Error('CORS: Access-Control-Allow-Origin header is missing or incorrect')
  }
  if (!headers.get('Access-Control-Allow-Headers')?.includes('content-type')) {
    throw new Error('CORS: Access-Control-Allow-Headers is missing content-type')
  }
}

/**
 * エラーレスポンスを検証するヘルパー関数
 */
export async function assertErrorResponse(
  response: Response,
  expectedStatus: number,
  expectedError: string
) {
  if (response.status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, but got ${response.status}`)
  }
  
  const body = await response.json()
  if (body.error !== expectedError) {
    throw new Error(`Expected error "${expectedError}", but got "${body.error}"`)
  }
}

/**
 * 成功レスポンスを検証するヘルパー関数
 */
export async function assertSuccessResponse(
  response: Response,
  companyId: string,
  fileName: string
) {
  if (response.status !== 200) {
    throw new Error(`Expected status 200, but got ${response.status}`)
  }
  
  const body = await response.json()
  if (!body.generatedText) {
    throw new Error('generatedText is missing in response')
  }
  if (body.identifiedCompany !== companyId) {
    throw new Error(`Expected companyId ${companyId}, but got ${body.identifiedCompany}`)
  }
  if (body.originalFileName !== fileName) {
    throw new Error(`Expected fileName ${fileName}, but got ${body.originalFileName}`)
  }
}

/**
 * PDFファイルのBase64エンコードをモックするヘルパー
 */
export function mockBase64Encode(): string {
  return 'bW9ja2VkLWJhc2U2NC1lbmNvZGVkLXBkZi1jb250ZW50'
}

/**
 * 日付のモックを作成するヘルパー関数
 */
export function createMockDate(dateString: string = '2025-06-07T12:00:00.000Z'): Date {
  return new Date(dateString)
}

/**
 * コンソールログをキャプチャするヘルパー関数
 */
export function captureConsoleLogs() {
  const logs: string[] = []
  const originalLog = console.log
  const originalError = console.error
  const originalWarn = console.warn

  console.log = (...args: any[]) => {
    logs.push(['LOG', ...args].join(' '))
  }
  console.error = (...args: any[]) => {
    logs.push(['ERROR', ...args].join(' '))
  }
  console.warn = (...args: any[]) => {
    logs.push(['WARN', ...args].join(' '))
  }

  return {
    logs,
    restore: () => {
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    },
  }
}