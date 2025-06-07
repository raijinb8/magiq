# MSW (Mock Service Worker) 使用ガイド

このディレクトリには、MSWを使用したAPIモックの設定が含まれています。

## ディレクトリ構造

```
src/test/mocks/
├── handlers.ts      # APIエンドポイントのモックハンドラー定義
├── server.ts        # Node.js環境用のMSWサーバー設定（テスト用）
├── browser.ts       # ブラウザ環境用のMSWワーカー設定（開発用）
├── factories.ts     # テストデータ生成用のファクトリー関数
├── index.ts         # エクスポート用のインデックスファイル
└── example-usage.test.tsx  # 使用例のテストファイル
```

## 基本的な使い方

### 1. デフォルトのモックを使用

テストファイルで特別な設定なしに、デフォルトのモックレスポンスが使用できます：

```typescript
it('ユーザー情報を取得', async () => {
  const response = await fetch('https://example.supabase.co/auth/v1/user');
  const data = await response.json();
  
  expect(data.email).toBe('test@example.com');
});
```

### 2. 特定のテストでモックを上書き

`mockApiResponse`を使用して、特定のテストだけモックを変更できます：

```typescript
import { mockApiResponse } from '@/test/mocks';
import { http, HttpResponse } from 'msw';

it('カスタムユーザーを返す', async () => {
  mockApiResponse(
    http.get('*/auth/v1/user', () => {
      return HttpResponse.json({
        id: 'custom-id',
        email: 'custom@example.com',
      });
    })
  );
  
  // テストコード
});
```

### 3. エラーレスポンスのモック

```typescript
mockApiResponse(
  http.get('*/auth/v1/user', () => {
    return HttpResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  })
);
```

### 4. ファクトリーを使用したテストデータ生成

```typescript
import { createMockUser, createMockWorkOrder } from '@/test/mocks';

const user = createMockUser({ 
  email: 'custom@example.com' 
});

const workOrders = createMockWorkOrders(5, {
  status: 'completed'
});
```

## 定義済みのモックハンドラー

### 認証 (authHandlers)
- `POST /auth/v1/token` - ログイン
- `POST /auth/v1/signup` - サインアップ
- `POST /auth/v1/logout` - ログアウト
- `GET /auth/v1/user` - ユーザー情報取得

### ストレージ (storageHandlers)
- `POST /storage/v1/object/:bucket/*` - ファイルアップロード
- `GET /storage/v1/object/:bucket/*` - ファイルダウンロード
- `DELETE /storage/v1/object/:bucket/*` - ファイル削除

### Edge Functions (edgeFunctionHandlers)
- `POST /functions/v1/process-pdf-single` - PDF処理

### データベース (databaseHandlers)
- `GET /rest/v1/work_orders` - 作業指示書一覧取得
- `POST /rest/v1/work_orders` - 作業指示書作成
- `PATCH /rest/v1/work_orders` - 作業指示書更新
- `GET /rest/v1/shifts` - シフト一覧取得
- `POST /rest/v1/shifts` - シフト作成

## 高度な使い方

### リクエストの検証

```typescript
let capturedRequest: any = null;

mockApiResponse(
  http.post('*/api/endpoint', async ({ request }) => {
    capturedRequest = await request.json();
    return HttpResponse.json({ success: true });
  })
);

// APIコール実行後
expect(capturedRequest).toEqual({
  expectedField: 'expectedValue'
});
```

### 動的なレスポンス

```typescript
mockApiResponse(
  http.get('*/api/items/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      id,
      name: `Item ${id}`,
    });
  })
);
```

### 遅延レスポンス

```typescript
mockApiResponse(
  http.get('*/api/slow', async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return HttpResponse.json({ data: 'slow response' });
  })
);
```

## ベストプラクティス

1. **デフォルトハンドラーを汎用的に保つ**: 多くのテストで使える一般的なレスポンスを定義
2. **ファクトリーを活用**: テストデータの一貫性を保つ
3. **エラーケースもテスト**: 成功ケースだけでなくエラーレスポンスもテスト
4. **リクエストの検証**: 送信されるデータが正しいか確認
5. **テスト後のクリーンアップ**: MSWが自動的にハンドラーをリセット

## トラブルシューティング

### 未処理のリクエスト警告
コンソールに「[MSW] Warning: captured a request without a matching handler」が表示される場合は、対応するハンドラーを`handlers.ts`に追加してください。

### TypeScriptエラー
MSWの型定義を正しくインポートしているか確認：
```typescript
import { http, HttpResponse } from 'msw';
```