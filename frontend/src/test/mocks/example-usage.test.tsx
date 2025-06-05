import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { mockApiResponse, createMockUser, createMockWorkOrder } from '@/test/mocks';

describe('MSW使用例', () => {
  it('デフォルトのモックハンドラーを使用する例', async () => {
    // デフォルトのハンドラーが自動的に適用されるため、追加設定不要
    const response = await fetch('https://example.supabase.co/auth/v1/user');
    const data = await response.json();
    
    expect(data).toMatchObject({
      id: 'mock-user-id',
      email: 'test@example.com',
    });
  });

  it('特定のテストでハンドラーを上書きする例', async () => {
    // このテストだけ別のレスポンスを返す
    mockApiResponse(
      http.get('*/auth/v1/user', () => {
        return HttpResponse.json({
          id: 'custom-user-id',
          email: 'custom@example.com',
          email_confirmed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      })
    );

    const response = await fetch('https://example.supabase.co/auth/v1/user');
    const data = await response.json();
    
    expect(data.id).toBe('custom-user-id');
    expect(data.email).toBe('custom@example.com');
  });

  it('エラーレスポンスをモックする例', async () => {
    mockApiResponse(
      http.get('*/auth/v1/user', () => {
        return HttpResponse.json(
          { error: 'Unauthorized', error_description: 'Invalid token' },
          { status: 401 }
        );
      })
    );

    const response = await fetch('https://example.supabase.co/auth/v1/user');
    
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('ファクトリーを使用してテストデータを生成する例', () => {
    // ユーザーデータの生成
    const user = createMockUser({
      email: 'factory@example.com',
      email_confirmed_at: null, // 未確認ユーザー
    });
    
    expect(user.email).toBe('factory@example.com');
    expect(user.email_confirmed_at).toBeNull();
    
    // 作業指示書データの生成
    const workOrder = createMockWorkOrder({
      status: 'processing',
      company_name: 'カスタム会社',
    });
    
    expect(workOrder.status).toBe('processing');
    expect(workOrder.company_name).toBe('カスタム会社');
  });

  it('リクエストボディを検証する例', async () => {
    let capturedBody: unknown = null;
    
    mockApiResponse(
      http.post('*/auth/v1/token', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ access_token: 'test-token' });
      })
    );

    await fetch('https://example.supabase.co/auth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    expect(capturedBody).toEqual({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('複数のAPIコールを連携させる例', async () => {
    // 1. ログイン
    const loginResponse = await fetch('https://example.supabase.co/auth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });
    const loginData = await loginResponse.json();
    
    expect(loginData.access_token).toBe('mock-access-token');
    
    // 2. 認証トークンを使ってユーザー情報を取得
    const userResponse = await fetch('https://example.supabase.co/auth/v1/user', {
      headers: {
        Authorization: `Bearer ${loginData.access_token}`,
      },
    });
    const userData = await userResponse.json();
    
    expect(userData.email).toBe('test@example.com');
  });

  it('FormDataを使用したファイルアップロードの例', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['PDF content'], { type: 'application/pdf' }), 'test.pdf');
    formData.append('companyId', 'NOHARA_G');

    const response = await fetch('https://example.supabase.co/functions/v1/process-pdf-single', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.promptIdentifier).toBe('NOHARA_G_V20250526');
    expect(data.generatedText).toContain('物件名：テストマンション');
  });
});