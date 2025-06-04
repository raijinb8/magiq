# テストガイドライン

## 概要

このドキュメントでは、Magiqプロジェクトにおけるテスト戦略、ベストプラクティス、および具体的な実装方法について説明します。

## テスト戦略

### テストピラミッド

```
       E2E テスト (少数)
     /                  \
    統合テスト (適度)
   /                    \
  ユニットテスト (多数)
```

1. **ユニットテスト (70%)**：関数、フック、コンポーネントの単体テスト
2. **統合テスト (20%)**：複数のコンポーネントやAPIとの統合テスト
3. **E2Eテスト (10%)**：ユーザーフローの包括的なテスト

### カバレッジ目標

- **全体**: 80%以上
- **重要なビジネスロジック**: 100%
- **UIコンポーネント**: 70%以上
- **ユーティリティ関数**: 90%以上

## フロントエンド テスト環境

### 技術スタック

- **テストランナー**: Vitest
- **テストライブラリ**: React Testing Library
- **モック**: MSW (Mock Service Worker)
- **アサーション**: expect + @testing-library/jest-dom
- **カバレッジ**: @vitest/coverage-v8

### セットアップ

```bash
cd frontend
npm install
npm test          # テスト実行
npm run test:ui   # UI付きテスト
npm run test:coverage  # カバレッジ付きテスト
```

### ディレクトリ構造

```
frontend/src/
├── __tests__/           # アプリケーション全体のテスト
├── components/
│   └── **/__tests__/    # コンポーネントテスト
├── hooks/
│   └── **/__tests__/    # カスタムフックテスト
├── lib/
│   └── **/*.test.ts     # ユーティリティテスト
├── pages/
│   └── **/__tests__/    # ページコンポーネントテスト
├── store/
│   └── **/__tests__/    # 状態管理テスト
└── test/
    ├── setup.ts         # テスト環境設定
    ├── utils.tsx        # テストユーティリティ
    └── mocks/
        ├── handlers.ts  # MSWハンドラー
        └── server.ts    # MSWサーバー
```

## テストの書き方

### 1. ユニットテスト

#### ユーティリティ関数のテスト

```typescript
import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn utility function', () => {
  it('複数のクラス名を結合する', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('条件付きクラスを処理する', () => {
    expect(cn('base', true && 'conditional')).toBe('base conditional');
    expect(cn('base', false && 'conditional')).toBe('base');
  });

  it('undefinedとnullを無視する', () => {
    expect(cn('class1', undefined, null, 'class2')).toBe('class1 class2');
  });
});
```

#### カスタムフックのテスト

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '../test/utils';
import { useCounter } from '../hooks/useCounter';

describe('useCounter', () => {
  it('初期値が0である', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('incrementで値が増加する', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });
});
```

### 2. コンポーネントテスト

#### 基本的なコンポーネントテスト

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, setupUser } from '../../test/utils';
import { Button } from '../button';

describe('Button', () => {
  it('正しくレンダリングされる', () => {
    render(<Button>クリック</Button>);
    expect(screen.getByRole('button', { name: 'クリック' })).toBeInTheDocument();
  });

  it('クリックイベントが発火する', async () => {
    const user = setupUser();
    const handleClick = vi.fn();
    
    render(<Button onClick={handleClick}>クリック</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### フォームコンポーネントのテスト

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, setupUser } from '../../test/utils';
import { ContactForm } from '../ContactForm';

describe('ContactForm', () => {
  it('フォーム送信が正常に動作する', async () => {
    const user = setupUser();
    const onSubmit = vi.fn();
    
    render(<ContactForm onSubmit={onSubmit} />);
    
    // フォーム入力
    await user.type(screen.getByLabelText('名前'), '田中太郎');
    await user.type(screen.getByLabelText('メール'), 'tanaka@example.com');
    
    // 送信
    await user.click(screen.getByRole('button', { name: '送信' }));
    
    expect(onSubmit).toHaveBeenCalledWith({
      name: '田中太郎',
      email: 'tanaka@example.com'
    });
  });
});
```

### 3. APIテスト（MSW使用）

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '../test/utils';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { UserList } from '../components/UserList';

describe('UserList API integration', () => {
  it('ユーザーリストが正常に表示される', async () => {
    render(<UserList />);
    
    await waitFor(() => {
      expect(screen.getByText('田中太郎')).toBeInTheDocument();
    });
  });

  it('APIエラー時にエラーメッセージが表示される', async () => {
    // エラーレスポンスをモック
    server.use(
      http.get('/api/users', () => {
        return HttpResponse.json(
          { error: 'サーバーエラー' },
          { status: 500 }
        );
      })
    );

    render(<UserList />);
    
    await waitFor(() => {
      expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
    });
  });
});
```

## バックエンド テスト環境

### 技術スタック

- **テストランナー**: Deno Test
- **アサーション**: Deno標準ライブラリ
- **モック**: カスタムモック関数

### セットアップ

```bash
cd supabase
deno test --allow-all functions/              # テスト実行
deno test --allow-all --watch functions/      # ウォッチモード
deno test --allow-all --coverage functions/   # カバレッジ付き
```

### Edge Functionのテスト

```typescript
import { assertEquals, assertExists } from "https://deno.land/std@0.192.0/testing/asserts.ts";

Deno.test("PDF処理関数", async () => {
  const mockFile = new File(["mock pdf"], "test.pdf", { type: "application/pdf" });
  const formData = new FormData();
  formData.append("file", mockFile);
  formData.append("companyId", "NOHARA_G");

  const request = new Request("http://localhost", {
    method: "POST",
    body: formData,
  });

  // 関数の呼び出しとテスト
  const response = await handleRequest(request);
  assertEquals(response.status, 200);
  
  const data = await response.json();
  assertExists(data.generatedText);
});
```

## ベストプラクティス

### 1. テスト命名規則

```typescript
describe('機能名またはコンポーネント名', () => {
  describe('特定の状況', () => {
    it('期待される動作を説明する', () => {
      // テスト実装
    });
  });
});
```

### 2. AAA パターン

```typescript
it('ユーザーがログインできる', async () => {
  // Arrange（準備）
  const user = setupUser();
  render(<LoginForm />);
  
  // Act（実行）
  await user.type(screen.getByLabelText('メール'), 'test@example.com');
  await user.type(screen.getByLabelText('パスワード'), 'password');
  await user.click(screen.getByRole('button', { name: 'ログイン' }));
  
  // Assert（検証）
  expect(screen.getByText('ログイン成功')).toBeInTheDocument();
});
```

### 3. Testing Library原則

- **what**ではなく**how**をテストする
- 実装の詳細ではなく、ユーザーの観点でテストする
- `getByRole`、`getByLabelText`などの意味的なクエリを使用

```typescript
// ❌ 悪い例：実装詳細に依存
expect(container.querySelector('.submit-button')).toBeInTheDocument();

// ✅ 良い例：ユーザー観点
expect(screen.getByRole('button', { name: '送信' })).toBeInTheDocument();
```

### 4. モックの使用指針

- **外部API**: 必ずモックする
- **日付・時間**: モックを検討
- **Math.random**: 決定論的な値にモック
- **内部関数**: 可能な限りモックしない

## TDD（テスト駆動開発）ワークフロー

### 1. Red-Green-Refactor サイクル

```typescript
// 1. RED: 失敗するテストを書く
describe('Calculator', () => {
  it('二つの数字を加算する', () => {
    expect(add(2, 3)).toBe(5); // この時点では add 関数が存在しない
  });
});

// 2. GREEN: テストをパスする最小限のコードを書く
function add(a: number, b: number): number {
  return a + b;
}

// 3. REFACTOR: コードを改善する
function add(a: number, b: number): number {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('引数は数値である必要があります');
  }
  return a + b;
}
```

### 2. テストファースト開発の手順

1. **要件分析**: 実装する機能の要件を明確にする
2. **テスト設計**: テストケースを考える
3. **テスト実装**: 失敗するテストを書く
4. **最小実装**: テストをパスする最小限のコードを書く
5. **リファクタリング**: コードを改善する
6. **繰り返し**: 次の機能に移る

## CI/CD統合

### GitHub Actions

- **プルリクエスト時**: フルテストスイート実行
- **mainブランチマージ時**: テスト + デプロイ
- **カバレッジレポート**: Codecovにアップロード
- **品質チェック**: SonarCloudによる静的解析

### カバレッジしきい値

```javascript
// vitest.config.ts
coverage: {
  thresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}
```

## トラブルシューティング

### よくある問題

1. **テストのタイムアウト**
   ```typescript
   // 解決策：waitForを使用
   await waitFor(() => {
     expect(screen.getByText('結果')).toBeInTheDocument();
   }, { timeout: 3000 });
   ```

2. **非同期処理のテスト**
   ```typescript
   // 解決策：async/awaitとwaitForを適切に使用
   it('非同期データの読み込み', async () => {
     render(<DataComponent />);
     await waitFor(() => {
       expect(screen.getByText('データ')).toBeInTheDocument();
     });
   });
   ```

3. **MSWでのAPI モック**
   ```typescript
   // 解決策：setup.tsでMSWサーバーを適切に設定
   beforeAll(() => server.listen());
   afterEach(() => server.resetHandlers());
   afterAll(() => server.close());
   ```

## パフォーマンス考慮事項

1. **並列実行**: Vitestは デフォルトで並列実行
2. **ファイル分割**: 大きなテストファイルは適切に分割
3. **共通設定**: `setup.ts`で共通の設定を行う
4. **選択的実行**: `describe.only`、`it.only`で特定のテストのみ実行

## まとめ

このガイドラインに従って、品質の高いテストコードを書き、安定したアプリケーションを構築してください。テストは単なる品質保証ツールではなく、設計を改善し、リファクタリングを安全に行うための重要な投資です。