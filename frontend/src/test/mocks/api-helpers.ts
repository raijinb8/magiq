/**
 * MSWテスト用のAPIヘルパー関数
 * テストコード内で簡単にAPIレスポンスをモックできるユーティリティ
 */

import { http, HttpResponse } from 'msw';
import { server } from './server';

// レスポンス作成ヘルパー
export const createMockResponse = {
  // 成功レスポンス
  success: <T>(data: T, status = 200) => 
    HttpResponse.json(data as any, { status }),
  
  // エラーレスポンス
  error: (message: string, status = 400) => 
    HttpResponse.json(
      { error: message, error_description: message },
      { status }
    ),
  
  // 認証エラー
  unauthorized: (message = '認証が必要です') => 
    HttpResponse.json(
      { error: 'Unauthorized', error_description: message },
      { status: 401 }
    ),
  
  // 空のレスポンス
  empty: (status = 204) => new HttpResponse(null, { status }),
  
  // ファイルレスポンス
  file: (content: string | Blob, contentType = 'application/octet-stream') => 
    new HttpResponse(
      typeof content === 'string' ? content : content,
      {
        headers: {
          'Content-Type': contentType,
        },
      }
    ),
};

// 動的なハンドラー追加/削除
export const mockApi = {
  // 一時的にハンドラーを追加
  addHandler: (handler: Parameters<typeof server.use>[0]) => {
    server.use(handler);
  },
  
  // 認証が必要なユーザーをモック
  mockAuthenticatedUser: (userData = {
    id: 'test-user',
    email: 'test@example.com',
    role: 'user',
  }) => {
    server.use(
      http.get('*/auth/v1/user', () => 
        createMockResponse.success({
          ...userData,
          email_confirmed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      )
    );
  },
  
  // 特定のエンドポイントを一時的に失敗させる
  mockApiFailure: (endpoint: string, status = 500, message = 'Internal Server Error') => {
    server.use(
      http.all(endpoint, () => createMockResponse.error(message, status))
    );
  },
  
  // PDF処理の成功/失敗をモック
  mockPdfProcessing: (success = true, customResponse?: object) => {
    server.use(
      http.post('*/functions/v1/process-pdf-single', () => {
        if (!success) {
          return createMockResponse.error('PDF処理に失敗しました', 500);
        }
        
        return createMockResponse.success({
          success: true,
          generatedText: 'モックで生成されたテキスト',
          promptIdentifier: 'MOCK_V20250605',
          processingTime: 1000,
          tokenUsage: { prompt: 50, completion: 25, total: 75 },
          ...customResponse,
        });
      })
    );
  },
  
  // ストレージ操作をモック
  mockStorageOperation: (operation: 'upload' | 'download' | 'delete', success = true) => {
    const handlers = {
      upload: http.post('*/storage/v1/object/:bucket/*', () => 
        success 
          ? createMockResponse.success({
              path: 'mock/file/path.pdf',
              id: 'mock-file-id',
              fullPath: 'bucket/mock/file/path.pdf',
            })
          : createMockResponse.error('アップロードに失敗しました', 500)
      ),
      
      download: http.get('*/storage/v1/object/:bucket/*', () => 
        success 
          ? createMockResponse.file('モックファイルコンテンツ', 'application/pdf')
          : createMockResponse.error('ファイルが見つかりません', 404)
      ),
      
      delete: http.delete('*/storage/v1/object/:bucket/*', () => 
        success 
          ? createMockResponse.success({ message: '削除完了' })
          : createMockResponse.error('削除に失敗しました', 500)
      ),
    };
    
    server.use(handlers[operation]);
  },
  
  // データベース操作をモック
  mockDatabaseOperation: (table: 'work_orders' | 'shifts', operation: 'get' | 'post' | 'patch' | 'delete', success = true) => {
    const endpoint = `*/rest/v1/${table}`;
    
    const handlers = {
      get: http.get(endpoint, () => 
        success 
          ? createMockResponse.success([{ id: 1, mock: 'data' }])
          : createMockResponse.error('データの取得に失敗しました', 500)
      ),
      
      post: http.post(endpoint, () => 
        success 
          ? createMockResponse.success({ id: 1, created: true }, 201)
          : createMockResponse.error('データの作成に失敗しました', 400)
      ),
      
      patch: http.patch(endpoint, () => 
        success 
          ? createMockResponse.success({ id: 1, updated: true })
          : createMockResponse.error('データの更新に失敗しました', 400)
      ),
      
      delete: http.delete(endpoint, () => 
        success 
          ? createMockResponse.empty()
          : createMockResponse.error('データの削除に失敗しました', 400)
      ),
    };
    
    server.use(handlers[operation]);
  },
};

// テストで使用する共通パターン
export const testScenarios = {
  // ログインからPDF処理まで
  fullWorkflow: () => {
    mockApi.mockAuthenticatedUser();
    mockApi.mockPdfProcessing(true);
    mockApi.mockStorageOperation('upload', true);
    mockApi.mockDatabaseOperation('work_orders', 'post', true);
  },
  
  // ネットワークエラーシナリオ
  networkErrors: () => {
    mockApi.mockApiFailure('*/auth/v1/*', 503, 'Service Unavailable');
    mockApi.mockApiFailure('*/functions/v1/*', 503, 'Service Unavailable');
    mockApi.mockApiFailure('*/storage/v1/*', 503, 'Service Unavailable');
    mockApi.mockApiFailure('*/rest/v1/*', 503, 'Service Unavailable');
  },
  
  // 認証エラーシナリオ
  authenticationErrors: () => {
    server.use(
      http.all('*/auth/v1/*', () => createMockResponse.unauthorized()),
      http.all('*/functions/v1/*', () => createMockResponse.unauthorized()),
      http.all('*/storage/v1/*', () => createMockResponse.unauthorized()),
      http.all('*/rest/v1/*', () => createMockResponse.unauthorized())
    );
  },
  
  // レート制限シナリオ
  rateLimitErrors: () => {
    server.use(
      http.all('*/functions/v1/*', () => createMockResponse.error('Rate limit exceeded', 429))
    );
  },
};

// テスト後のクリーンアップ
export const cleanupMocks = () => {
  server.resetHandlers();
};

// 便利な型定義
export type MockScenario = keyof typeof testScenarios;
export type ApiOperation = 'upload' | 'download' | 'delete';
export type DatabaseTable = 'work_orders' | 'shifts';
export type DatabaseOperation = 'get' | 'post' | 'patch' | 'delete';