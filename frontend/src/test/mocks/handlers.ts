import { http, HttpResponse } from 'msw';

// Supabase認証エンドポイントのモック
export const authHandlers = [
  // ログイン
  http.post('*/auth/v1/token', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    
    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'mock-user-id',
          email: 'test@example.com',
          email_confirmed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
    }
    
    return HttpResponse.json(
      { error: 'Invalid login credentials', error_description: 'Invalid login credentials' },
      { status: 400 }
    );
  }),

  // サインアップ
  http.post('*/auth/v1/signup', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    
    return HttpResponse.json({
      id: 'mock-user-id',
      email: body.email,
      email_confirmed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }),

  // ログアウト
  http.post('*/auth/v1/logout', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // ユーザー情報取得
  http.get('*/auth/v1/user', () => {
    return HttpResponse.json({
      id: 'mock-user-id',
      email: 'test@example.com',
      email_confirmed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }),
];

// Supabase Storageエンドポイントのモック
export const storageHandlers = [
  // ファイルアップロード
  http.post('*/storage/v1/object/:bucket/*', async ({ params }) => {
    const { bucket } = params;
    
    return HttpResponse.json({
      path: `${bucket}/mock-file-path.pdf`,
      id: 'mock-file-id',
      fullPath: `${bucket}/mock-file-path.pdf`,
    });
  }),

  // ファイルダウンロード
  http.get('*/storage/v1/object/:bucket/*', () => {
    return new HttpResponse(new Blob(['mock file content']), {
      headers: {
        'Content-Type': 'application/pdf',
      },
    });
  }),

  // ファイル削除
  http.delete('*/storage/v1/object/:bucket/*', () => {
    return HttpResponse.json({ message: 'Successfully deleted' });
  }),
];

// Edge Functions (PDF処理) のモック
export const edgeFunctionHandlers = [
  // PDF処理
  http.post('*/functions/v1/process-pdf-single', async ({ request }) => {
    const formData = await request.formData();
    const companyId = formData.get('companyId');
    
    // 会社別のモックレスポンス
    const mockResponses: Record<string, {
      generatedText: string;
      promptIdentifier: string;
    }> = {
      'NOHARA_G': {
        generatedText: `物件名：テストマンション
工事内容：内装リフォーム工事
日付：2025年06月05日
作業者：田中太郎
作業時間：9:00〜17:00
作業内容：
- 壁紙張替え
- フローリング施工
- 設備点検`,
        promptIdentifier: 'NOHARA_G_V20250526',
      },
      'KATOUBENIYA_MISAWA': {
        generatedText: `受注番号：TEST-001
発注者：株式会社テスト
現場名：テスト現場
作業内容：防水工事
施工日：2025年06月05日
施工者：山田花子
完了報告：異常なし`,
        promptIdentifier: 'KATOUBENIYA_MISAWA_V20250526',
      },
    };
    
    const response = mockResponses[companyId as string] || {
      generatedText: 'デフォルトのテキスト抽出結果',
      promptIdentifier: 'DEFAULT',
    };
    
    return HttpResponse.json({
      success: true,
      ...response,
      processingTime: 1234,
      tokenUsage: {
        prompt: 100,
        completion: 50,
        total: 150,
      },
    });
  }),
];

// データベース操作のモック
export const databaseHandlers = [
  // work_orders取得
  http.get('*/rest/v1/work_orders', ({ request }) => {
    const url = new URL(request.url);
    // selectパラメータは将来的にフィルタリングに使用予定
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _select = url.searchParams.get('select');
    
    return HttpResponse.json([
      {
        id: 1,
        file_name: 'test-file-1.pdf',
        uploaded_at: '2025-06-01T10:00:00Z',
        company_name: '野原G住環境',
        prompt_identifier: 'NOHARA_G_V20250526',
        generated_text: '物件名：テストマンション...',
        status: 'completed',
        gemini_processed_at: '2025-06-01T10:00:30Z',
      },
      {
        id: 2,
        file_name: 'test-file-2.pdf',
        uploaded_at: '2025-06-02T14:30:00Z',
        company_name: '加藤ベニヤ池袋_ミサワホーム',
        prompt_identifier: 'KATOUBENIYA_MISAWA_V20250526',
        generated_text: '受注番号：TEST-002...',
        status: 'completed',
        gemini_processed_at: '2025-06-02T14:30:45Z',
      },
    ]);
  }),

  // work_orders作成
  http.post('*/rest/v1/work_orders', async ({ request }) => {
    const body = await request.json();
    
    return HttpResponse.json({
      id: 3,
      ...body,
      uploaded_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
  }),

  // work_orders更新
  http.patch('*/rest/v1/work_orders', async ({ request }) => {
    const body = await request.json();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    return HttpResponse.json({
      id: Number(id),
      ...body,
      updated_at: new Date().toISOString(),
    });
  }),

  // shifts取得
  http.get('*/rest/v1/shifts', () => {
    return HttpResponse.json([
      {
        id: 1,
        user_id: 'mock-user-id',
        date: '2025-06-05',
        shift_type: 'morning',
        note: '朝番勤務',
      },
      {
        id: 2,
        user_id: 'mock-user-id',
        date: '2025-06-06',
        shift_type: 'night',
        custom_end_time: '22:00',
        note: '夜勤（延長あり）',
      },
    ]);
  }),

  // shifts作成
  http.post('*/rest/v1/shifts', async ({ request }) => {
    const body = await request.json();
    
    return HttpResponse.json({
      id: 3,
      ...body,
      created_at: new Date().toISOString(),
    });
  }),
];

// すべてのハンドラーをエクスポート
export const handlers = [
  ...authHandlers,
  ...storageHandlers,
  ...edgeFunctionHandlers,
  ...databaseHandlers,
];