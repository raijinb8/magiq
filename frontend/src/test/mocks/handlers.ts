import { http, HttpResponse } from 'msw';

/**
 * Supabase API 用の包括的なモックハンドラー
 * テスト環境で実際のAPI呼び出しをモックし、一貫した動作を提供
 */

// 認証トークンの管理用
interface MockAuthState {
  isAuthenticated: boolean;
  currentUser: {
    id: string;
    email: string;
    email_confirmed_at: string | null;
    created_at: string;
    updated_at: string;
    user_metadata?: Record<string, unknown>;
  } | null;
  accessToken: string | null;
}

// モック用の状態管理
const mockAuthState: MockAuthState = {
  isAuthenticated: false,
  currentUser: null,
  accessToken: null,
};

// Supabase認証エンドポイントのモック
export const authHandlers = [
  // メールパスワードログイン
  http.post('*/auth/v1/token', async ({ request }) => {
    const body = await request.json() as { 
      email: string; 
      password: string;
      grant_type?: string;
    };
    
    // 有効なテストユーザーのデータベース
    const validUsers = [
      { email: 'test@example.com', password: 'password123', role: 'user' },
      { email: 'admin@example.com', password: 'admin123', role: 'admin' },
      { email: 'manager@nohara.com', password: 'nohara123', role: 'manager' },
      { email: 'staff@katoubeniya.com', password: 'katou123', role: 'staff' },
    ];
    
    const user = validUsers.find(u => u.email === body.email && u.password === body.password);
    
    if (user) {
      const mockUser = {
        id: `mock-user-${user.role}`,
        email: user.email,
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_metadata: {
          role: user.role,
          company: user.email.includes('nohara') ? 'NOHARA_G' : 
                   user.email.includes('katou') ? 'KATOUBENIYA_MISAWA' : 'GENERAL'
        },
      };
      
      // 状態を更新
      mockAuthState.isAuthenticated = true;
      mockAuthState.currentUser = mockUser;
      mockAuthState.accessToken = `mock-access-token-${Date.now()}`;
      
      return HttpResponse.json({
        access_token: mockAuthState.accessToken,
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: `mock-refresh-token-${Date.now()}`,
        user: mockUser,
      });
    }
    
    return HttpResponse.json(
      { error: 'Invalid login credentials', error_description: 'メールアドレスまたはパスワードが正しくありません' },
      { status: 400 }
    );
  }),
  
  // OAuth ログイン (Google, GitHub等)
  http.post('*/auth/v1/authorize', async ({ request }) => {
    const body = await request.json() as { provider: string; redirect_to?: string };
    
    return HttpResponse.json({
      url: `https://mock-oauth-provider.com/auth?provider=${body.provider}&redirect=${body.redirect_to || 'http://localhost:3000'}`,
      provider: body.provider,
    });
  }),
  
  // トークンリフレッシュ
  http.post('*/auth/v1/token?grant_type=refresh_token', async ({ request }) => {
    const body = await request.json() as { refresh_token: string };
    
    if (body.refresh_token && body.refresh_token.startsWith('mock-refresh-token')) {
      const newAccessToken = `mock-access-token-${Date.now()}`;
      mockAuthState.accessToken = newAccessToken;
      
      return HttpResponse.json({
        access_token: newAccessToken,
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: `mock-refresh-token-${Date.now()}`,
        user: mockAuthState.currentUser,
      });
    }
    
    return HttpResponse.json(
      { error: 'Invalid refresh token', error_description: 'リフレッシュトークンが無効です' },
      { status: 401 }
    );
  }),

  // メールサインアップ
  http.post('*/auth/v1/signup', async ({ request }) => {
    const body = await request.json() as { 
      email: string; 
      password: string;
      data?: Record<string, unknown>;
    };
    
    // 既存ユーザーのチェック
    const existingEmails = ['existing@example.com', 'admin@example.com'];
    
    if (existingEmails.includes(body.email)) {
      return HttpResponse.json(
        { error: 'User already registered', error_description: 'このメールアドレスは既に登録されています' },
        { status: 422 }
      );
    }
    
    // パスワード強度チェック
    if (body.password.length < 6) {
      return HttpResponse.json(
        { error: 'Weak password', error_description: 'パスワードは6文字以上である必要があります' },
        { status: 422 }
      );
    }
    
    const newUser = {
      id: `mock-new-user-${Date.now()}`,
      email: body.email,
      email_confirmed_at: null, // メール確認待ち
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_metadata: body.data || {},
    };
    
    return HttpResponse.json({
      user: newUser,
      session: null, // メール確認前はセッションなし
    });
  }),
  
  // メールアドレス確認
  http.post('*/auth/v1/verify', async ({ request }) => {
    const body = await request.json() as { 
      type: 'signup' | 'email_change' | 'recovery';
      token: string;
      email: string;
    };
    
    if (body.token === 'valid-confirmation-token') {
      const confirmedUser = {
        id: 'mock-confirmed-user',
        email: body.email,
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      mockAuthState.isAuthenticated = true;
      mockAuthState.currentUser = confirmedUser;
      mockAuthState.accessToken = `mock-access-token-${Date.now()}`;
      
      return HttpResponse.json({
        access_token: mockAuthState.accessToken,
        token_type: 'bearer',
        expires_in: 3600,
        user: confirmedUser,
      });
    }
    
    return HttpResponse.json(
      { error: 'Invalid token', error_description: '確認トークンが無効または期限切れです' },
      { status: 400 }
    );
  }),
  
  // パスワードリセット要求
  http.post('*/auth/v1/recover', async ({ request }) => {
    const body = await request.json() as { email: string };
    
    // メール送信成功（実際の送信は行わない）
    return HttpResponse.json({
      message: 'パスワードリセットメールを送信しました',
    });
  }),
  
  // パスワード更新
  http.put('*/auth/v1/user', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer mock-access-token')) {
      return HttpResponse.json(
        { error: 'Unauthorized', error_description: '認証が必要です' },
        { status: 401 }
      );
    }
    
    const body = await request.json() as { 
      password?: string;
      email?: string;
      data?: Record<string, unknown>;
    };
    
    const updatedUser: NonNullable<MockAuthState['currentUser']> = {
      ...mockAuthState.currentUser!,
      updated_at: new Date().toISOString(),
      user_metadata: {
        ...mockAuthState.currentUser!.user_metadata,
        ...body.data,
      },
    };
    
    if (body.email && body.email !== mockAuthState.currentUser!.email) {
      updatedUser.email_confirmed_at = null; // 新しいメールは未確認
    }
    
    mockAuthState.currentUser = updatedUser;
    
    return HttpResponse.json({
      user: updatedUser,
    });
  }),

  // ログアウト
  http.post('*/auth/v1/logout', () => {
    // 認証状態をリセット
    mockAuthState.isAuthenticated = false;
    mockAuthState.currentUser = null;
    mockAuthState.accessToken = null;
    
    return new HttpResponse(null, { status: 204 });
  }),

  // ユーザー情報取得
  http.get('*/auth/v1/user', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.includes('mock-access-token')) {
      return HttpResponse.json(
        { error: 'Unauthorized', error_description: '認証が必要です' },
        { status: 401 }
      );
    }
    
    if (!mockAuthState.isAuthenticated || !mockAuthState.currentUser) {
      return HttpResponse.json(
        { error: 'User not found', error_description: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(mockAuthState.currentUser);
  }),
];

// ストレージ用のモックデータ
interface MockFile {
  id: string;
  name: string;
  size: number;
  content: Blob;
  bucket: string;
  path: string;
  contentType: string;
  uploadedAt: string;
}

const mockFileStorage = new Map<string, MockFile>();

// Supabase Storageエンドポイントのモック
export const storageHandlers = [
  // ファイルアップロード
  http.post('*/storage/v1/object/:bucket/*', async ({ request, params }) => {
    const { bucket } = params;
    const pathMatch = request.url.match(/\/object\/.+?\/(.*)/);
    const filePath = pathMatch ? pathMatch[1] : 'unknown-file';
    
    // 認証チェック
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.includes('mock-access-token')) {
      return HttpResponse.json(
        { error: 'Unauthorized', message: 'ファイルアップロードには認証が必要です' },
        { status: 401 }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return HttpResponse.json(
        { error: 'No file provided', message: 'ファイルが指定されていません' },
        { status: 400 }
      );
    }
    
    // ファイルサイズ制限 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return HttpResponse.json(
        { error: 'File too large', message: 'ファイルサイズは10MB以下である必要があります' },
        { status: 413 }
      );
    }
    
    // 許可されたファイルタイプのチェック
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      return HttpResponse.json(
        { error: 'Invalid file type', message: `サポートされていないファイルタイプ: ${file.type}` },
        { status: 400 }
      );
    }
    
    const mockFile: MockFile = {
      id: `mock-file-${Date.now()}`,
      name: file.name,
      size: file.size,
      content: file,
      bucket: bucket as string,
      path: filePath,
      contentType: file.type,
      uploadedAt: new Date().toISOString(),
    };
    
    const fullPath = `${bucket}/${filePath}`;
    mockFileStorage.set(fullPath, mockFile);
    
    return HttpResponse.json({
      path: filePath,
      id: mockFile.id,
      fullPath,
      bucketId: bucket,
      size: file.size,
      mimeType: file.type,
      lastModified: mockFile.uploadedAt,
    });
  }),

  // ファイルダウンロード
  http.get('*/storage/v1/object/:bucket/*', ({ request, params }) => {
    const { bucket } = params;
    const pathMatch = request.url.match(/\/object\/.+?\/(.*)/);
    const filePath = pathMatch ? pathMatch[1] : '';
    const fullPath = `${bucket}/${filePath}`;
    
    const file = mockFileStorage.get(fullPath);
    
    if (!file) {
      return new HttpResponse(null, { status: 404 });
    }
    
    // 簡単なアクセス制御（privateバケットの場合）
    if (bucket === 'private' || bucket === 'work-orders') {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.includes('mock-access-token')) {
        return new HttpResponse(null, { status: 401 });
      }
    }
    
    return new HttpResponse(file.content, {
      headers: {
        'Content-Type': file.contentType,
        'Content-Length': file.size.toString(),
        'Cache-Control': 'max-age=3600',
        'ETag': `"${file.id}"`,
        'Last-Modified': new Date(file.uploadedAt).toUTCString(),
      },
    });
  }),

  // ファイル削除
  http.delete('*/storage/v1/object/:bucket/*', ({ request, params }) => {
    const { bucket } = params;
    const pathMatch = request.url.match(/\/object\/.+?\/(.*)/);
    const filePath = pathMatch ? pathMatch[1] : '';
    const fullPath = `${bucket}/${filePath}`;
    
    // 認証チェック
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.includes('mock-access-token')) {
      return HttpResponse.json(
        { error: 'Unauthorized', message: 'ファイル削除には認証が必要です' },
        { status: 401 }
      );
    }
    
    const existed = mockFileStorage.has(fullPath);
    
    if (!existed) {
      return HttpResponse.json(
        { error: 'File not found', message: 'ファイルが見つかりません' },
        { status: 404 }
      );
    }
    
    mockFileStorage.delete(fullPath);
    
    return HttpResponse.json({ 
      message: 'ファイルを正常に削除しました',
      path: filePath,
    });
  }),
];

// ストレージモックユーティリティ
export const storageUtils = {
  // モックファイルを追加
  addMockFile: (bucket: string, path: string, content: Blob, contentType: string) => {
    const mockFile: MockFile = {
      id: `mock-file-${Date.now()}`,
      name: path.split('/').pop() || 'unknown',
      size: content.size,
      content,
      bucket,
      path,
      contentType,
      uploadedAt: new Date().toISOString(),
    };
    mockFileStorage.set(`${bucket}/${path}`, mockFile);
    return mockFile;
  },
  
  // モックストレージをクリア
  clearMockStorage: () => {
    mockFileStorage.clear();
  },
  
  // ファイル数を取得
  getFileCount: () => mockFileStorage.size,
};

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

// データベースモックユーティリティ
export const databaseUtils = {
  // モックデータをリセット
  resetMockData: () => {
    mockWorkOrders.clear();
    mockShifts.clear();
    nextWorkOrderId = 1;
    nextShiftId = 1;
    initializeMockData();
  },
  
  // モックデータを追加
  addMockWorkOrder: (workOrder: Omit<MockWorkOrder, 'id' | 'created_at' | 'updated_at'>) => {
    const newWorkOrder: MockWorkOrder = {
      ...workOrder,
      id: nextWorkOrderId++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockWorkOrders.set(newWorkOrder.id, newWorkOrder);
    return newWorkOrder;
  },
  
  addMockShift: (shift: Omit<MockShift, 'id' | 'created_at' | 'updated_at'>) => {
    const newShift: MockShift = {
      ...shift,
      id: nextShiftId++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockShifts.set(newShift.id, newShift);
    return newShift;
  },
  
  // データ数を取得
  getDataCounts: () => ({
    workOrders: mockWorkOrders.size,
    shifts: mockShifts.size,
  }),
};

// モックユーティリティをまとめてエクスポート
export const mockUtils = {
  // 認証状態をリセット
  resetAuthState: () => {
    mockAuthState.isAuthenticated = false;
    mockAuthState.currentUser = null;
    mockAuthState.accessToken = null;
  },
  
  // 現在の認証状態を取得
  getAuthState: () => ({ ...mockAuthState }),
  
  // すべてのモックデータをリセット
  resetAllData: () => {
    mockUtils.resetAuthState();
    storageUtils.clearMockStorage();
    databaseUtils.resetMockData();
  },
};

// すべてのハンドラーをエクスポート
export const handlers = [
  ...authHandlers,
  ...storageHandlers,
  ...edgeFunctionHandlers,
  ...databaseHandlers,
];

// デフォルトのモックファイルを追加
storageUtils.addMockFile(
  'work-orders',
  'sample/nohara-renovation.pdf',
  new Blob(['%PDF-1.4 サンプルPDFコンテンツ'], { type: 'application/pdf' }),
  'application/pdf'
);

storageUtils.addMockFile(
  'public',
  'images/company-logo.png',
  new Blob(['モック画像データ'], { type: 'image/png' }),
  'image/png'
);