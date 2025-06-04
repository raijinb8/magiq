// MSW ハンドラー定義
import { http, HttpResponse } from 'msw';
import { mockUser, mockShift, mockWorkOrder } from '../utils';

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
      user: mockUser,
    });
  }),

  // ユーザー情報取得
  http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json({
      ...mockUser,
      created_at: '2024-01-01T00:00:00Z',
    });
  }),

  // Work Orders API
  http.get(`${SUPABASE_URL}/rest/v1/work_orders`, ({ request }) => {
    const url = new URL(request.url);
    const companyName = url.searchParams.get('company_name');
    
    let results = [mockWorkOrder];
    
    // フィルタリング
    if (companyName) {
      results = results.filter(item => item.company_name === companyName);
    }
    
    return HttpResponse.json(results);
  }),

  // Work Order作成
  http.post(`${SUPABASE_URL}/rest/v1/work_orders`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...mockWorkOrder,
      ...body,
      id: 'new-work-order-id',
    }, { status: 201 });
  }),

  // Shifts API
  http.get(`${SUPABASE_URL}/rest/v1/shifts`, ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');
    
    let results = [mockShift];
    
    if (userId) {
      results = results.filter(shift => shift.user_id === userId);
    }
    
    return HttpResponse.json(results);
  }),

  // Shift作成/更新
  http.post(`${SUPABASE_URL}/rest/v1/shifts`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...mockShift,
      ...body,
      id: 'new-shift-id',
    }, { status: 201 });
  }),

  // ストレージAPI (PDF アップロード)
  http.post(`${SUPABASE_URL}/storage/v1/object/work-orders/*`, async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    return HttpResponse.json({
      Key: `work-orders/${file?.name || 'test-file.pdf'}`,
      path: `work-orders/${file?.name || 'test-file.pdf'}`,
    });
  }),

  // Edge Function (PDF処理)
  http.post(`${SUPABASE_URL}/functions/v1/process-pdf-single`, async ({ request }) => {
    const formData = await request.formData();
    const companyId = formData.get('companyId') as string;
    
    // エラーをシミュレートする場合
    if (companyId === 'error-test') {
      return HttpResponse.json(
        { error: 'PDF処理中にエラーが発生しました' },
        { status: 500 }
      );
    }
    
    return HttpResponse.json({
      generatedText: 'PDFから抽出されたテキスト内容です。\n建物名: テストビル\n工事内容: 改修工事',
      promptIdentifier: 'NOHARA_G:V20250526',
      tokenUsage: {
        input: 1000,
        output: 500,
        total: 1500,
      },
      processingTime: 2500,
    });
  }),

  // エラーレスポンス用のハンドラー
  http.get(`${SUPABASE_URL}/rest/v1/error-test`, () => {
    return HttpResponse.json(
      { error: 'テスト用のエラー' },
      { status: 500 }
    );
  }),
];