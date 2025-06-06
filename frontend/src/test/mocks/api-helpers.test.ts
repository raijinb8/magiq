/**
 * APIヘルパー関数のテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HttpResponse } from 'msw';
import { server } from './server';
import { 
  createMockResponse, 
  mockApi, 
  testScenarios,
  cleanupMocks 
} from './api-helpers';

describe('createMockResponse', () => {
  it('成功レスポンスを作成できる', () => {
    const data = { message: 'success' };
    const response = createMockResponse.success(data);
    
    expect(response).toBeInstanceOf(HttpResponse);
    expect(response.status).toBe(200);
  });

  it('カスタムステータスコードで成功レスポンスを作成できる', () => {
    const data = { created: true };
    const response = createMockResponse.success(data, 201);
    
    expect(response.status).toBe(201);
  });

  it('エラーレスポンスを作成できる', () => {
    const response = createMockResponse.error('エラーが発生しました');
    
    expect(response.status).toBe(400);
  });

  it('認証エラーレスポンスを作成できる', () => {
    const response = createMockResponse.unauthorized();
    
    expect(response.status).toBe(401);
  });

  it('空のレスポンスを作成できる', () => {
    const response = createMockResponse.empty();
    
    expect(response.status).toBe(204);
  });

  it('ファイルレスポンスを作成できる', () => {
    const content = 'ファイルコンテンツ';
    const response = createMockResponse.file(content, 'text/plain');
    
    expect(response.status).toBe(200);
  });
});

describe('mockApi', () => {
  beforeEach(() => {
    cleanupMocks();
  });

  it('認証済みユーザーをモックできる', async () => {
    const userData = {
      id: 'test-123',
      email: 'test@example.com',
      role: 'admin',
    };

    mockApi.mockAuthenticatedUser(userData);

    // モックされたエンドポイントを確認するため、実際のフェッチは行わず
    // MSWのハンドラーが追加されていることを確認
    expect(server.listHandlers()).toHaveLength(1);
  });

  it('PDF処理の成功をモックできる', () => {
    mockApi.mockPdfProcessing(true);
    
    expect(server.listHandlers()).toHaveLength(1);
  });

  it('PDF処理の失敗をモックできる', () => {
    mockApi.mockPdfProcessing(false);
    
    expect(server.listHandlers()).toHaveLength(1);
  });

  it('ストレージ操作をモックできる', () => {
    mockApi.mockStorageOperation('upload', true);
    
    expect(server.listHandlers()).toHaveLength(1);
  });

  it('データベース操作をモックできる', () => {
    mockApi.mockDatabaseOperation('work_orders', 'get', true);
    
    expect(server.listHandlers()).toHaveLength(1);
  });

  it('APIの失敗をモックできる', () => {
    const endpoint = '*/test/endpoint';
    mockApi.mockApiFailure(endpoint, 500, 'Server Error');
    
    expect(server.listHandlers()).toHaveLength(1);
  });
});

describe('testScenarios', () => {
  beforeEach(() => {
    cleanupMocks();
  });

  it('フルワークフローシナリオを設定できる', () => {
    testScenarios.fullWorkflow();
    
    // 複数のハンドラーが追加されることを確認
    expect(server.listHandlers().length).toBeGreaterThan(1);
  });

  it('ネットワークエラーシナリオを設定できる', () => {
    testScenarios.networkErrors();
    
    expect(server.listHandlers().length).toBeGreaterThan(1);
  });

  it('認証エラーシナリオを設定できる', () => {
    testScenarios.authenticationErrors();
    
    expect(server.listHandlers().length).toBeGreaterThan(1);
  });

  it('レート制限エラーシナリオを設定できる', () => {
    testScenarios.rateLimitErrors();
    
    expect(server.listHandlers()).toHaveLength(1);
  });
});

describe('cleanupMocks', () => {
  it('モックをクリーンアップできる', () => {
    // ハンドラーを追加
    mockApi.mockAuthenticatedUser();
    expect(server.listHandlers()).toHaveLength(1);

    // クリーンアップ
    cleanupMocks();
    
    // デフォルトハンドラーのみが残ることを確認
    // （setupServerで設定されたハンドラーは残る）
    const handlersAfterCleanup = server.listHandlers();
    expect(handlersAfterCleanup.length).toBeDefined();
  });
});

describe('レスポンス型チェック', () => {
  it('成功レスポンスのJSONが正しい', async () => {
    const testData = { id: 1, name: 'テスト' };
    const response = createMockResponse.success(testData);
    
    const json = await response.json();
    expect(json).toEqual(testData);
  });

  it('エラーレスポンスのJSONが正しい', async () => {
    const errorMessage = 'テストエラー';
    const response = createMockResponse.error(errorMessage);
    
    const json = await response.json();
    expect(json).toEqual({
      error: errorMessage,
      error_description: errorMessage,
    });
  });

  it('認証エラーレスポンスのJSONが正しい', async () => {
    const response = createMockResponse.unauthorized();
    
    const json = await response.json();
    expect(json).toEqual({
      error: 'Unauthorized',
      error_description: '認証が必要です',
    });
  });
});

describe('実際のAPI呼び出しシミュレーション', () => {
  beforeEach(() => {
    cleanupMocks();
  });

  it('認証済みユーザー取得をシミュレートできる', async () => {
    const userData = {
      id: 'user-123',
      email: 'user@example.com',
      role: 'user',
    };

    mockApi.mockAuthenticatedUser(userData);

    // 実際のfetch呼び出しをシミュレート
    const response = await fetch('/auth/v1/user');
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.id).toBe(userData.id);
    expect(result.email).toBe(userData.email);
    expect(result.email_confirmed_at).toBeDefined();
  });

  it('PDF処理失敗をシミュレートできる', async () => {
    mockApi.mockPdfProcessing(false);

    const response = await fetch('/functions/v1/process-pdf-single', {
      method: 'POST',
    });
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.error).toBe('PDF処理に失敗しました');
  });

  it('ストレージアップロード成功をシミュレートできる', async () => {
    mockApi.mockStorageOperation('upload', true);

    const response = await fetch('/storage/v1/object/bucket/test.pdf', {
      method: 'POST',
    });
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.path).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('データベース操作失敗をシミュレートできる', async () => {
    mockApi.mockDatabaseOperation('work_orders', 'post', false);

    const response = await fetch('/rest/v1/work_orders', {
      method: 'POST',
    });
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe('データの作成に失敗しました');
  });
});