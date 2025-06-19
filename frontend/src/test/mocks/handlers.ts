import { http, HttpResponse } from 'msw';
import {
  createMockUser,
  createMockWorkOrder,
  createMockShift,
  createMockWorkOrders,
  createMockShifts,
  createMockAuthResponse,
  createMockPdfProcessingResponse,
  createMockWorkOrderForCompany,
  createMockSupabaseResponse,
  createMockErrorResponse,
  resetFactorySequences,
  type MockUser,
  type MockWorkOrder,
  type MockShift,
  type CompanyOptionValue,
} from './factories';

/**
 * Supabase API 用の包括的なモックハンドラー
 * ファクトリーシステムと統合し、動的で一貫したテストデータを提供
 */

// 認証トークンの管理用（ファクトリーシステム統合版）
interface MockAuthState {
  isAuthenticated: boolean;
  currentUser: MockUser | null;
  accessToken: string | null;
}

// モック用の状態管理
const mockAuthState: MockAuthState = {
  isAuthenticated: false,
  currentUser: null,
  accessToken: null,
};

// テスト用ユーザーデータベース（ファクトリーで生成）
const createTestUsersDatabase = () => [
  createMockUser({
    email: 'test@example.com',
    role: 'user',
    user_metadata: { password: 'password123' },
  }),
  createMockUser({
    email: 'admin@example.com',
    role: 'admin',
    user_metadata: { password: 'admin123' },
  }),
  createMockUser({
    email: 'manager@nohara.com',
    role: 'manager',
    user_metadata: {
      password: 'nohara123',
      company: 'NOHARA_G',
    },
  }),
  createMockUser({
    email: 'staff@katoubeniya.com',
    role: 'staff',
    user_metadata: {
      password: 'katou123',
      company: 'KATOUBENIYA_IKEBUKURO_MISAWA',
    },
  }),
];

// 動的に生成されるテストユーザー
let testUsersDatabase = createTestUsersDatabase();

// Supabase認証エンドポイントのモック
export const authHandlers = [
  // メールパスワードログイン（ファクトリー統合版）
  http.post('*/auth/v1/token', async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
      password: string;
      grant_type?: string;
    };

    // ファクトリーで生成されたユーザーから認証
    const user = testUsersDatabase.find(
      (u) =>
        u.email === body.email && u.user_metadata?.password === body.password
    );

    if (user) {
      // 状態を更新
      mockAuthState.isAuthenticated = true;
      mockAuthState.currentUser = user;
      mockAuthState.accessToken = `mock-access-token-${Date.now()}`;

      // ファクトリーで認証レスポンスを生成
      const authResponse = createMockAuthResponse(user);

      // 生成されたトークンで状態を同期
      mockAuthState.accessToken = authResponse.access_token;

      return HttpResponse.json(authResponse);
    }

    return HttpResponse.json(
      {
        error: 'Invalid login credentials',
        error_description: 'メールアドレスまたはパスワードが正しくありません',
      },
      { status: 400 }
    );
  }),

  // OAuth ログイン (Google, GitHub等)
  http.post('*/auth/v1/authorize', async ({ request }) => {
    const body = (await request.json()) as {
      provider: string;
      redirect_to?: string;
    };

    return HttpResponse.json({
      url: `https://mock-oauth-provider.com/auth?provider=${body.provider}&redirect=${body.redirect_to || 'http://localhost:3000'}`,
      provider: body.provider,
    });
  }),

  // トークンリフレッシュ
  http.post('*/auth/v1/token', async ({ request }) => {
    const url = new URL(request.url);
    const grantType = url.searchParams.get('grant_type');

    if (grantType !== 'refresh_token') {
      return;
    }
    const body = (await request.json()) as { refresh_token: string };

    if (
      body.refresh_token &&
      body.refresh_token.startsWith('mock-refresh-token')
    ) {
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
      {
        error: 'Invalid refresh token',
        error_description: 'リフレッシュトークンが無効です',
      },
      { status: 401 }
    );
  }),

  // メールサインアップ（ファクトリー統合版）
  http.post('*/auth/v1/signup', async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
      password: string;
      data?: Record<string, unknown>;
    };

    // 既存ユーザーのチェック
    const existingUser = testUsersDatabase.find((u) => u.email === body.email);

    if (existingUser) {
      return HttpResponse.json(
        createMockErrorResponse(
          'このメールアドレスは既に登録されています',
          422
        ),
        { status: 422 }
      );
    }

    // パスワード強度チェック
    if (body.password.length < 6) {
      return HttpResponse.json(
        createMockErrorResponse(
          'パスワードは6文字以上である必要があります',
          422
        ),
        { status: 422 }
      );
    }

    // ファクトリーで新しいユーザーを作成
    const newUser = createMockUser({
      email: body.email,
      email_confirmed_at: null, // メール確認待ち
      user_metadata: {
        ...body.data,
        password: body.password, // テスト用にパスワードを保存
      },
    });

    // テストデータベースに追加
    testUsersDatabase.push(newUser);

    return HttpResponse.json({
      user: newUser,
      session: null, // メール確認前はセッションなし
    });
  }),

  // メールアドレス確認
  http.post('*/auth/v1/verify', async ({ request }) => {
    const body = (await request.json()) as {
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
      {
        error: 'Invalid token',
        error_description: '確認トークンが無効または期限切れです',
      },
      { status: 400 }
    );
  }),

  // パスワードリセット要求
  http.post('*/auth/v1/recover', async ({ request }) => {
    const body = (await request.json()) as { email: string };

    // 実際のAPIではメールアドレスの存在確認を行うが、モックでは常に成功
    if (!body.email || !body.email.includes('@')) {
      return HttpResponse.json(
        {
          error: 'Invalid email',
          error_description: '有効なメールアドレスを入力してください',
        },
        { status: 400 }
      );
    }

    // メール送信成功（実際の送信は行わない）
    return HttpResponse.json({
      message: 'パスワードリセットメールを送信しました',
      email: body.email,
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

    const body = (await request.json()) as {
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
        {
          error: 'User not found',
          error_description: 'ユーザーが見つかりません',
        },
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
        {
          error: 'Unauthorized',
          message: 'ファイルアップロードには認証が必要です',
        },
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
        {
          error: 'File too large',
          message: 'ファイルサイズは10MB以下である必要があります',
        },
        { status: 413 }
      );
    }

    // 許可されたファイルタイプのチェック
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
    ];
    if (!allowedTypes.includes(file.type)) {
      return HttpResponse.json(
        {
          error: 'Invalid file type',
          message: `サポートされていないファイルタイプ: ${file.type}`,
        },
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
        ETag: `"${file.id}"`,
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
  addMockFile: (
    bucket: string,
    path: string,
    content: Blob,
    contentType: string
  ) => {
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

// Edge Functions (PDF処理) のモック（ファクトリー統合版）
export const edgeFunctionHandlers = [
  // PDF処理
  http.post('*/functions/v1/process-pdf-single', async ({ request }) => {
    const formData = await request.formData();
    const companyIdValue = formData.get('companyId');
    const fileValue = formData.get('file');

    const companyId =
      typeof companyIdValue === 'string'
        ? (companyIdValue as CompanyOptionValue)
        : '';
    const file = fileValue instanceof File ? fileValue : null;

    // 認証チェック
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.includes('mock-access-token')) {
      return HttpResponse.json(createMockErrorResponse('認証が必要です', 401), {
        status: 401,
      });
    }

    // ファイルの基本チェック
    if (!file) {
      return HttpResponse.json(
        createMockErrorResponse('ファイルが指定されていません', 400),
        { status: 400 }
      );
    }

    if (!file.type.includes('pdf')) {
      return HttpResponse.json(
        createMockErrorResponse('PDFファイルのみサポートされています', 400),
        { status: 400 }
      );
    }

    // ファイルサイズ制限（5MB）
    if (file.size > 5 * 1024 * 1024) {
      return HttpResponse.json(
        createMockErrorResponse(
          'ファイルサイズは5MB以下である必要があります',
          413
        ),
        { status: 413 }
      );
    }

    // ランダムな処理失敗をシミュレート（5%の確率）
    if (Math.random() < 0.05) {
      return HttpResponse.json(
        createMockErrorResponse('PDF処理中にエラーが発生しました', 500),
        { status: 500 }
      );
    }

    // ファクトリーでPDF処理レスポンスを生成
    try {
      let response;

      if (
        companyId &&
        ['NOHARA_G', 'KATOUBENIYA_IKEBUKURO_MISAWA', 'YAMADA_K'].includes(companyId)
      ) {
        // 会社固有のレスポンス
        const workOrder = createMockWorkOrderForCompany(companyId);
        response = createMockPdfProcessingResponse({
          generatedText: workOrder.generated_text,
          promptIdentifier: workOrder.prompt_identifier,
          originalFileName: file.name,
        });
      } else {
        // デフォルトレスポンス
        response = createMockPdfProcessingResponse({
          generatedText: 'デフォルトのテキスト抽出結果',
          promptIdentifier: 'DEFAULT_V20250605',
          originalFileName: file.name,
        });
      }

      return HttpResponse.json(response);
    } catch {
      return HttpResponse.json(
        createMockErrorResponse(
          'PDF処理中に予期しないエラーが発生しました',
          500
        ),
        { status: 500 }
      );
    }
  }),
];

// データベース操作のモック（ファクトリー統合版）
// 動的なデータベース状態
let mockWorkOrders: MockWorkOrder[] = [];
let mockShifts: MockShift[] = [];

// 初期データの生成
const initializeMockDatabase = () => {
  mockWorkOrders = [
    createMockWorkOrderForCompany('NOHARA_G', { id: 1 }),
    createMockWorkOrderForCompany('KATOUBENIYA_IKEBUKURO_MISAWA', { id: 2 }),
    ...createMockWorkOrders(3, { status: 'completed' }),
  ];

  mockShifts = createMockShifts(10, {
    user_id: mockAuthState.currentUser?.id || 'default-user',
  });
};

// 初期化実行
initializeMockDatabase();

export const databaseHandlers = [
  // work_orders取得（ファクトリー統合版）
  http.get('*/rest/v1/work_orders', ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');
    const status = url.searchParams.get('status');
    const limit = url.searchParams.get('limit');

    // 認証チェック
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.includes('mock-access-token')) {
      return HttpResponse.json(createMockSupabaseResponse([], true), {
        status: 401,
      });
    }

    let filteredWorkOrders = [...mockWorkOrders];

    // フィルタリング
    if (userId) {
      filteredWorkOrders = filteredWorkOrders.filter(
        (wo) => wo.user_id === userId
      );
    }

    if (status) {
      filteredWorkOrders = filteredWorkOrders.filter(
        (wo) => wo.status === status
      );
    }

    // 制限
    if (limit) {
      filteredWorkOrders = filteredWorkOrders.slice(0, parseInt(limit));
    }

    return HttpResponse.json(filteredWorkOrders);
  }),

  // work_orders作成（ファクトリー統合版）
  http.post('*/rest/v1/work_orders', async ({ request }) => {
    const body = (await request.json()) as Partial<MockWorkOrder>;

    // 認証チェック
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.includes('mock-access-token')) {
      return HttpResponse.json(createMockSupabaseResponse([], true), {
        status: 401,
      });
    }

    // ファクトリーで新しいワークオーダーを作成
    const newWorkOrder = createMockWorkOrder({
      ...body,
      user_id: body.user_id || mockAuthState.currentUser?.id || 'default-user',
    });

    // データベースに追加
    mockWorkOrders.push(newWorkOrder);

    return HttpResponse.json(newWorkOrder, { status: 201 });
  }),

  // work_orders更新（ファクトリー統合版）
  http.patch('*/rest/v1/work_orders', async ({ request }) => {
    const body = (await request.json()) as Partial<MockWorkOrder>;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    // 認証チェック
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.includes('mock-access-token')) {
      return HttpResponse.json(createMockSupabaseResponse([], true), {
        status: 401,
      });
    }

    const workOrderIndex = mockWorkOrders.findIndex(
      (wo) => wo.id === Number(id)
    );

    if (workOrderIndex === -1) {
      return HttpResponse.json(
        createMockErrorResponse('ワークオーダーが見つかりません', 404),
        { status: 404 }
      );
    }

    // 更新
    mockWorkOrders[workOrderIndex] = {
      ...mockWorkOrders[workOrderIndex],
      ...body,
      updated_at: new Date().toISOString(),
    };

    return HttpResponse.json(mockWorkOrders[workOrderIndex]);
  }),

  // shifts取得（ファクトリー統合版）
  http.get('*/rest/v1/shifts', ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');
    const date = url.searchParams.get('date');

    // 認証チェック
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.includes('mock-access-token')) {
      return HttpResponse.json(createMockSupabaseResponse([], true), {
        status: 401,
      });
    }

    let filteredShifts = [...mockShifts];

    // フィルタリング
    if (userId) {
      filteredShifts = filteredShifts.filter(
        (shift) => shift.user_id === userId
      );
    }

    if (date) {
      filteredShifts = filteredShifts.filter((shift) => shift.date === date);
    }

    return HttpResponse.json(filteredShifts);
  }),

  // shifts作成（ファクトリー統合版）
  http.post('*/rest/v1/shifts', async ({ request }) => {
    const body = (await request.json()) as Partial<MockShift>;

    // 認証チェック
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.includes('mock-access-token')) {
      return HttpResponse.json(createMockSupabaseResponse([], true), {
        status: 401,
      });
    }

    // ファクトリーで新しいシフトを作成
    const newShift = createMockShift({
      ...body,
      user_id: body.user_id || mockAuthState.currentUser?.id || 'default-user',
    });

    // データベースに追加
    mockShifts.push(newShift);

    return HttpResponse.json(newShift, { status: 201 });
  }),
];

// データベースモックユーティリティ（ファクトリー統合版）
export const databaseUtils = {
  // モックデータベースをリセット
  resetMockData: () => {
    mockWorkOrders = [];
    mockShifts = [];
    initializeMockDatabase();
  },

  // 特定のデータを追加
  addMockWorkOrder: (workOrder: Partial<MockWorkOrder>) => {
    const newWorkOrder = createMockWorkOrder(workOrder);
    mockWorkOrders.push(newWorkOrder);
    return newWorkOrder;
  },

  addMockShift: (shift: Partial<MockShift>) => {
    const newShift = createMockShift(shift);
    mockShifts.push(newShift);
    return newShift;
  },

  // データ数を取得
  getDataCounts: () => ({
    workOrders: mockWorkOrders.length,
    shifts: mockShifts.length,
    users: testUsersDatabase.length,
  }),

  // 現在のデータを取得
  getCurrentData: () => ({
    workOrders: [...mockWorkOrders],
    shifts: [...mockShifts],
    users: [...testUsersDatabase],
  }),

  // 特定のユーザーのデータを生成
  seedUserData: (
    userId: string,
    options?: {
      workOrderCount?: number;
      shiftCount?: number;
    }
  ) => {
    const { workOrderCount = 3, shiftCount = 7 } = options || {};

    const userWorkOrders = createMockWorkOrders(workOrderCount, {
      user_id: userId,
    });
    const userShifts = createMockShifts(shiftCount, { user_id: userId });

    mockWorkOrders.push(...userWorkOrders);
    mockShifts.push(...userShifts);

    return { workOrders: userWorkOrders, shifts: userShifts };
  },
};

// モックユーティリティをまとめてエクスポート（ファクトリー統合版）
export const mockUtils = {
  // 認証状態をリセット
  resetAuthState: () => {
    mockAuthState.isAuthenticated = false;
    mockAuthState.currentUser = null;
    mockAuthState.accessToken = null;
  },

  // テストユーザーデータベースをリセット
  resetTestUsers: () => {
    testUsersDatabase = createTestUsersDatabase();
  },

  // 現在の認証状態を取得
  getAuthState: () => ({ ...mockAuthState }),

  // 特定のユーザーでログイン状態にする
  loginAsUser: (email: string) => {
    const user = testUsersDatabase.find((u) => u.email === email);
    if (user) {
      mockAuthState.isAuthenticated = true;
      mockAuthState.currentUser = user;
      mockAuthState.accessToken = `mock-access-token-${Date.now()}`;
      return user;
    }
    return null;
  },

  // 新しいテストユーザーを追加
  addTestUser: (userData: Partial<MockUser>) => {
    const newUser = createMockUser(userData);
    testUsersDatabase.push(newUser);
    return newUser;
  },

  // すべてのモックデータをリセット
  resetAllData: () => {
    resetFactorySequences();
    mockUtils.resetAuthState();
    mockUtils.resetTestUsers();
    storageUtils.clearMockStorage();
    databaseUtils.resetMockData();
  },

  // テストシナリオのセットアップ
  setupScenario: (scenarioName: 'clean' | 'populated' | 'error-prone') => {
    mockUtils.resetAllData();

    switch (scenarioName) {
      case 'clean':
        // クリーンな状態（初期データのみ）
        break;

      case 'populated': {
        // データが豊富な状態
        const activeUser = createMockUser({ email: 'active@example.com' });
        testUsersDatabase.push(activeUser);
        databaseUtils.seedUserData(activeUser.id, {
          workOrderCount: 10,
          shiftCount: 20,
        });
        break;
      }

      case 'error-prone': {
        // エラーが多い状態
        const errorUser = createMockUser({ email: 'error@example.com' });
        testUsersDatabase.push(errorUser);

        // エラー状態のワークオーダーを追加
        for (let i = 0; i < 5; i++) {
          const errorWorkOrder = createMockWorkOrder({
            user_id: errorUser.id,
            status: 'error',
            error_message: `エラー ${i + 1}: テスト用エラー`,
          });
          mockWorkOrders.push(errorWorkOrder);
        }
        break;
      }
    }
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
