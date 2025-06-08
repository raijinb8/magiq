# MSWテスト環境統合ガイド

このドキュメントでは、Mock Service Worker (MSW) とファクトリーシステムが統合されたテスト環境の使用方法について説明します。

## 概要

本プロジェクトのテスト環境では、以下のシステムが統合されています：

- **MSW**: APIリクエストのインターセプトとモック
- **ファクトリーシステム**: 一貫性のあるテストデータ生成
- **自動初期化**: テストセットアップでの自動統合
- **状態管理**: テスト間でのデータ独立性保証

## 主要機能

### 1. 自動初期化

テスト環境では、以下が自動的に初期化されます：

```typescript
// src/test/setup.ts で自動実行
import { setupMSW } from './mocks/server';
import { mockUtils } from './mocks/handlers';

// MSWサーバーの自動起動
setupMSW();

// 各テスト後の自動クリーンアップ
afterEach(() => {
  mockUtils.resetAllData(); // すべてのモックデータをリセット
});
```

### 2. ファクトリー統合APIモック

すべてのAPIエンドポイントがファクトリーシステムと統合されています：

```typescript
// 認証API - ファクトリーで生成されたユーザーで認証
// PDF処理API - 会社別のファクトリーデータ生成
// データベースAPI - 動的なCRUD操作
// ストレージAPI - ファイル操作のモック
```

### 3. 動的テストデータ

静的なハードコードデータではなく、動的に生成されるデータを使用：

```typescript
// ❌ 従来の静的データ
const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  // ... 固定値
};

// ✅ ファクトリー統合版
const mockUser = createMockUser({
  email: 'test@example.com',
  // その他は動的生成（ID、日時など）
});
```

## 基本的な使用方法

### シンプルなテストケース

```typescript
import { describe, it, expect } from 'vitest';
import { mockUtils, databaseUtils } from './mocks/handlers';
import { createMockUser, createMockWorkOrder } from './mocks/factories';

describe('基本的なAPIテスト', () => {
  it('ユーザーがワークオーダーを取得できる', async () => {
    // Given: ログイン状態のユーザー
    const user = mockUtils.loginAsUser('test@example.com');

    // When: ワークオーダー取得API呼び出し
    const response = await fetch(`/rest/v1/work_orders?user_id=${user!.id}`, {
      headers: {
        Authorization: `Bearer ${mockUtils.getAuthState().accessToken}`,
      },
    });

    // Then: 正常に取得される
    expect(response.status).toBe(200);
    const workOrders = await response.json();
    expect(Array.isArray(workOrders)).toBe(true);
  });
});
```

### 認証が必要なテスト

```typescript
describe('認証必須API', () => {
  it('ログイン後にPDF処理ができる', async () => {
    // ログイン状態を設定
    const user = mockUtils.loginAsUser('admin@example.com');
    const authToken = mockUtils.getAuthState().accessToken;

    // PDF処理リクエスト
    const formData = new FormData();
    formData.append(
      'file',
      new File(['test'], 'test.pdf', { type: 'application/pdf' })
    );
    formData.append('companyId', 'NOHARA_G');

    const response = await fetch('/functions/v1/process-pdf-single', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: formData,
    });

    expect(response.status).toBe(200);
  });
});
```

### データ生成とシナリオテスト

```typescript
describe('シナリオテスト', () => {
  it('データが豊富な環境での動作確認', () => {
    // Given: populatedシナリオを設定
    mockUtils.setupScenario('populated');

    // When: データ状況を確認
    const counts = databaseUtils.getDataCounts();

    // Then: 期待されるデータ量
    expect(counts.workOrders).toBeGreaterThan(10);
    expect(counts.users).toBeGreaterThan(4);
  });

  it('エラー状態での動作確認', () => {
    // エラーが多い環境をセットアップ
    mockUtils.setupScenario('error-prone');

    const data = databaseUtils.getCurrentData();
    const errorWorkOrders = data.workOrders.filter(
      (wo) => wo.status === 'error'
    );

    expect(errorWorkOrders.length).toBeGreaterThan(0);
  });
});
```

## 高度な使用方法

### カスタムテストデータの追加

```typescript
describe('カスタムデータテスト', () => {
  it('特定の条件のデータで動作確認', async () => {
    // カスタムユーザーを追加
    const customUser = mockUtils.addTestUser({
      email: 'custom@example.com',
      role: 'manager',
      user_metadata: {
        password: 'custom123',
        company: 'NOHARA_G',
      },
    });

    // カスタムワークオーダーを追加
    databaseUtils.addMockWorkOrder({
      user_id: customUser.id,
      status: 'processing',
      company_name: '野原G住環境',
    });

    // テスト実行...
  });
});
```

### リアルタイムデータ変更

```typescript
describe('動的データ変更', () => {
  it('テスト中にデータを動的に変更', async () => {
    const user = mockUtils.loginAsUser('test@example.com');

    // 初期状態の確認
    let response = await fetch(`/rest/v1/work_orders?user_id=${user!.id}`, {
      headers: {
        Authorization: `Bearer ${mockUtils.getAuthState().accessToken}`,
      },
    });
    let workOrders = await response.json();
    const initialCount = workOrders.length;

    // データを動的に追加
    databaseUtils.addMockWorkOrder({ user_id: user!.id });

    // 追加後の確認
    response = await fetch(`/rest/v1/work_orders?user_id=${user!.id}`, {
      headers: {
        Authorization: `Bearer ${mockUtils.getAuthState().accessToken}`,
      },
    });
    workOrders = await response.json();

    expect(workOrders.length).toBe(initialCount + 1);
  });
});
```

### ファイルアップロード・ダウンロードテスト

```typescript
describe('ファイル操作', () => {
  it('ファイルの完全なライフサイクルをテスト', async () => {
    const user = mockUtils.loginAsUser('staff@katoubeniya.com');
    const authToken = mockUtils.getAuthState().accessToken;

    // 1. アップロード
    const testFile = new File(['テスト内容'], 'lifecycle-test.pdf', {
      type: 'application/pdf',
    });

    const formData = new FormData();
    formData.append('file', testFile);

    const uploadResponse = await fetch(
      '/storage/v1/object/work-orders/lifecycle-test.pdf',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      }
    );
    expect(uploadResponse.status).toBe(200);

    // 2. ダウンロード
    const downloadResponse = await fetch(
      '/storage/v1/object/work-orders/lifecycle-test.pdf',
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    expect(downloadResponse.status).toBe(200);

    // 3. 削除
    const deleteResponse = await fetch(
      '/storage/v1/object/work-orders/lifecycle-test.pdf',
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    expect(deleteResponse.status).toBe(200);

    // 4. 削除後の確認
    const notFoundResponse = await fetch(
      '/storage/v1/object/work-orders/lifecycle-test.pdf'
    );
    expect(notFoundResponse.status).toBe(404);
  });
});
```

### リクエストボディのキャプチャと検証

```typescript
import { server } from './server';
import { http, HttpResponse } from 'msw';

describe('リクエストボディのキャプチャ', () => {
  it('送信されたデータを検証する', async () => {
    let capturedData: any = null;

    // カスタムハンドラーでリクエストボディをキャプチャ
    server.use(
      http.post('/rest/v1/work_orders', async ({ request }) => {
        capturedData = await request.json();
        return HttpResponse.json({ id: 'captured-123' });
      })
    );

    // リクエスト送信
    const response = await fetch('/rest/v1/work_orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockUtils.getAuthState().accessToken}`,
      },
      body: JSON.stringify({
        file_name: 'test.pdf',
        company_name: '野原G住環境',
        status: 'pending',
      }),
    });

    // キャプチャしたデータの検証
    expect(capturedData).toEqual({
      file_name: 'test.pdf',
      company_name: '野原G住環境',
      status: 'pending',
    });
  });

  it('FormDataの内容を検証する', async () => {
    let capturedFile: File | null = null;
    let capturedCompanyId: string | null = null;

    server.use(
      http.post('/functions/v1/process-pdf-single', async ({ request }) => {
        const formData = await request.formData();
        capturedFile = formData.get('file') as File;
        capturedCompanyId = formData.get('companyId') as string;

        return HttpResponse.json({
          success: true,
          data: { generated_text: 'Captured FormData' },
        });
      })
    );

    const testFile = new File(['test content'], 'test.pdf', {
      type: 'application/pdf',
    });
    const formData = new FormData();
    formData.append('file', testFile);
    formData.append('companyId', 'NOHARA_G');

    await fetch('/functions/v1/process-pdf-single', {
      method: 'POST',
      body: formData,
    });

    expect(capturedFile?.name).toBe('test.pdf');
    expect(capturedCompanyId).toBe('NOHARA_G');
  });
});
```

### 遅延レスポンスとタイムアウトのテスト

```typescript
import { delay } from 'msw';

describe('ネットワーク遅延のテスト', () => {
  it('遅延レスポンスの処理', async () => {
    // 2秒の遅延を追加
    server.use(
      http.get('/rest/v1/work_orders', async () => {
        await delay(2000);
        return HttpResponse.json([createMockWorkOrder({ status: 'delayed' })]);
      })
    );

    const startTime = Date.now();
    const response = await fetch('/rest/v1/work_orders');
    const endTime = Date.now();

    expect(response.status).toBe(200);
    expect(endTime - startTime).toBeGreaterThanOrEqual(2000);
  });

  it('タイムアウトのシミュレーション', async () => {
    server.use(
      http.post('/functions/v1/process-pdf-single', async () => {
        // 無限遅延でタイムアウトをシミュレート
        await delay('infinite');
        return HttpResponse.json({ success: true });
      })
    );

    // AbortControllerでタイムアウトを設定
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    try {
      await fetch('/functions/v1/process-pdf-single', {
        method: 'POST',
        signal: controller.signal,
        body: new FormData(),
      });

      fail('Should have timed out');
    } catch (error) {
      expect(error).toBeInstanceOf(DOMException);
      expect((error as DOMException).name).toBe('AbortError');
    } finally {
      clearTimeout(timeoutId);
    }
  });

  it('ネットワーク接続エラーのシミュレーション', async () => {
    server.use(
      http.get('/rest/v1/work_orders', () => {
        return HttpResponse.error();
      })
    );

    try {
      await fetch('/rest/v1/work_orders');
      fail('Should have thrown network error');
    } catch (error) {
      expect(error).toBeInstanceOf(TypeError);
      expect((error as TypeError).message).toContain('Failed to fetch');
    }
  });
});
```

## ユーティリティ関数

### mockUtils

```typescript
// 認証関連
mockUtils.resetAuthState(); // 認証状態をリセット
mockUtils.loginAsUser(email); // 指定ユーザーでログイン
mockUtils.getAuthState(); // 現在の認証状態を取得
mockUtils.addTestUser(userData); // 新しいテストユーザーを追加

// データ管理
mockUtils.resetAllData(); // すべてのモックデータをリセット
mockUtils.setupScenario(scenario); // テストシナリオをセットアップ

// 使用例
const user = mockUtils.loginAsUser('admin@example.com');
const authState = mockUtils.getAuthState();
console.log('Current user:', authState.currentUser?.email);
```

### databaseUtils

```typescript
// データベース操作
databaseUtils.resetMockData(); // モックDBをリセット
databaseUtils.addMockWorkOrder(data); // ワークオーダーを追加
databaseUtils.addMockShift(data); // シフトを追加
databaseUtils.getDataCounts(); // データ数を取得
databaseUtils.getCurrentData(); // 現在のデータを取得
databaseUtils.seedUserData(userId, options); // ユーザーデータを一括生成

// 使用例
const counts = databaseUtils.getDataCounts();
console.log('Work orders:', counts.workOrders);

databaseUtils.seedUserData('user-123', {
  workOrderCount: 5,
  shiftCount: 10,
});
```

### storageUtils

```typescript
// ストレージ操作
storageUtils.addMockFile(bucket, path, content, contentType); // ファイル追加
storageUtils.clearMockStorage(); // ストレージクリア
storageUtils.getFileCount(); // ファイル数取得

// 使用例
storageUtils.addMockFile(
  'work-orders',
  'test/sample.pdf',
  new Blob(['テスト'], { type: 'application/pdf' }),
  'application/pdf'
);
```

## ベストプラクティス

### 1. テスト独立性の確保

```typescript
describe('テストスイート', () => {
  beforeEach(() => {
    // 各テスト前にクリーンな状態にリセット
    // （setup.tsで自動実行されるが、明示的に書くこともできる）
    mockUtils.resetAllData();
  });

  it('テスト1', () => {
    // テスト固有のデータセットアップ
  });

  it('テスト2', () => {
    // テスト1の影響を受けない独立したテスト
  });
});
```

### 2. 意味のあるテストデータ

```typescript
// ❌ 悪い例：テストの意図が不明
const user = createMockUser();
const workOrder = createMockWorkOrder();

// ✅ 良い例：テストの意図が明確
const adminUser = createMockUser({
  role: 'admin',
  email: 'admin-test@example.com',
});

const pendingWorkOrder = createMockWorkOrder({
  status: 'pending',
  user_id: adminUser.id,
  company_name: '野原G住環境',
});
```

### 3. 適切なシナリオ選択

```typescript
describe('新規ユーザー機能', () => {
  beforeEach(() => {
    mockUtils.setupScenario('clean'); // 最小限のデータ
  });
  // 新規ユーザー向けのテスト
});

describe('ダッシュボード表示', () => {
  beforeEach(() => {
    mockUtils.setupScenario('populated'); // データが豊富
  });
  // 既存ユーザー向けのテスト
});

describe('エラーハンドリング', () => {
  beforeEach(() => {
    mockUtils.setupScenario('error-prone'); // エラーが多い状態
  });
  // エラー処理のテスト
});
```

### 4. APIレスポンスの検証

```typescript
it('APIレスポンスの形式を検証', async () => {
  const response = await fetch('/rest/v1/work_orders');
  const data = await response.json();

  // ステータスコードの確認
  expect(response.status).toBe(200);

  // レスポンス構造の確認
  expect(Array.isArray(data)).toBe(true);
  if (data.length > 0) {
    expect(data[0]).toHaveProperty('id');
    expect(data[0]).toHaveProperty('file_name');
    expect(data[0]).toHaveProperty('status');
  }
});
```

### 5. エラーケースのテスト

```typescript
describe('エラーハンドリング', () => {
  it('未認証でのアクセス', async () => {
    const response = await fetch('/rest/v1/work_orders');
    expect(response.status).toBe(401);

    const errorData = await response.json();
    expect(errorData.error).toBeDefined();
  });

  it('存在しないリソースへのアクセス', async () => {
    const user = mockUtils.loginAsUser('test@example.com');

    const response = await fetch('/rest/v1/work_orders?id=eq.999999', {
      headers: {
        Authorization: `Bearer ${mockUtils.getAuthState().accessToken}`,
      },
    });

    const data = await response.json();
    expect(data).toHaveLength(0); // 空の配列が返る
  });
});
```

## デバッグとトラブルシューティング

### ログ出力の活用

```typescript
describe('デバッグ例', () => {
  it('データ状況の確認', () => {
    // 現在のデータ状況を確認
    const counts = databaseUtils.getDataCounts();
    console.log('データ数:', counts);

    const authState = mockUtils.getAuthState();
    console.log('認証状態:', authState);

    const currentData = databaseUtils.getCurrentData();
    console.log('ワークオーダー例:', currentData.workOrders[0]);
  });
});
```

### よくある問題と解決策

1. **テスト間でデータが混在する**

   ```typescript
   // 解決策: beforeEach でリセット
   beforeEach(() => {
     mockUtils.resetAllData();
   });
   ```

2. **認証が必要なAPIでエラーが出る**

   ```typescript
   // 解決策: ログイン状態を確実に設定
   const user = mockUtils.loginAsUser('test@example.com');
   expect(user).not.toBeNull(); // ログイン成功を確認

   const authState = mockUtils.getAuthState();
   expect(authState.isAuthenticated).toBe(true);
   ```

3. **ファクトリーで生成されたデータが期待と異なる**
   ```typescript
   // 解決策: オーバーライドで明示的に指定
   const workOrder = createMockWorkOrder({
     status: 'completed', // 期待する状態を明示
     company_name: '野原G住環境', // 特定の会社を指定
   });
   ```

## パフォーマンス考慮事項

### テスト実行時間の最適化

1. **必要最小限のデータ生成**

   ```typescript
   // ❌ 過剰なデータ生成
   databaseUtils.seedUserData('user-1', {
     workOrderCount: 100,
     shiftCount: 200,
   });

   // ✅ 必要十分なデータ
   databaseUtils.seedUserData('user-1', { workOrderCount: 3, shiftCount: 5 });
   ```

2. **シナリオの適切な選択**

   ```typescript
   // 軽量なテストには 'clean' シナリオを使用
   mockUtils.setupScenario('clean');

   // データが必要なテストのみ 'populated' を使用
   mockUtils.setupScenario('populated');
   ```

3. **不要なAPI呼び出しの避ける**
   ```typescript
   // 必要な場合のみAPIを呼び出し、直接データをチェック
   const workOrders = databaseUtils.getCurrentData().workOrders;
   expect(workOrders.length).toBeGreaterThan(0);
   ```

## まとめ

このMSW統合システムにより、以下が実現されています：

- **一貫性**: ファクトリーシステムによる統一されたテストデータ
- **独立性**: テスト間でのデータ干渉なし
- **柔軟性**: 動的なデータ生成とカスタマイズ
- **リアリズム**: 実際のAPIレスポンス形式に準拠
- **保守性**: ドメイン変更時の影響を最小化

テストを書く際は、このガイドを参考に適切なパターンを選択し、保守しやすく信頼性の高いテストコードを作成してください。
