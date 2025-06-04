// MSW ハンドラー定義
import { http, HttpResponse } from 'msw';

// モックのベースURL
const SUPABASE_URL = 'https://test.supabase.co';

// Supabase API モックハンドラー
export const handlers = [
  // 認証エンドポイント
  http.post(`${SUPABASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
        role: 'authenticated',
      },
    });
  }),

  // ユーザー情報取得
  http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json({
      id: 'mock-user-id',
      email: 'test@example.com',
      role: 'authenticated',
      created_at: '2024-01-01T00:00:00Z',
    });
  }),

  // Work Orders API
  http.get(`${SUPABASE_URL}/rest/v1/work_orders`, () => {
    return HttpResponse.json([
      {
        id: '1',
        file_name: 'test.pdf',
        uploaded_at: '2024-01-01T00:00:00Z',
        company_name: '野原G住環境',
        status: 'completed',
        generated_text: 'モックで生成されたテキスト',
      },
    ]);
  }),

  // Shifts API
  http.get(`${SUPABASE_URL}/rest/v1/shifts`, () => {
    return HttpResponse.json([
      {
        id: '1',
        user_id: 'mock-user-id',
        date: '2024-01-01',
        shift_type: 'morning',
        note: 'テストシフト',
      },
    ]);
  }),

  // ストレージAPI (PDF アップロード)
  http.post(`${SUPABASE_URL}/storage/v1/object/work-orders/*`, async () => {
    return HttpResponse.json({
      Key: 'work-orders/test-file.pdf',
    });
  }),

  // Edge Function (PDF処理)
  http.post(`${SUPABASE_URL}/functions/v1/process-pdf-single`, async () => {
    return HttpResponse.json({
      generatedText: 'PDFから抽出されたテキスト',
      promptIdentifier: 'NOHARA_G:V20250526',
      tokenUsage: {
        input: 1000,
        output: 500,
        total: 1500,
      },
      processingTime: 2500,
    });
  }),
];