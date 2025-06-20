# テストガイドライン

MagIQプロジェクトでは、品質の高いコードを維持するため、テスト駆動開発（TDD）を採用しています。このドキュメントでは、テストの書き方、実行方法、ベストプラクティスについて説明します。

## 目次

1. [テスト環境の概要](#テスト環境の概要)
2. [テスト駆動開発（TDD）](#テスト駆動開発tdd)
3. [テストの実行](#テストの実行)
4. [テストの書き方](#テストの書き方)
5. [モックとテストデータ](#モックとテストデータ)
6. [カバレッジ](#カバレッジ)
7. [CI/CD統合](#cicd統合)
8. [トラブルシューティング](#トラブルシューティング)

## テスト環境の概要

### フロントエンド

- **テストランナー**: Vitest 3.2.1
- **テストライブラリ**: React Testing Library 16.3.0
- **モックライブラリ**: MSW (Mock Service Worker) 2.8.6
- **アサーションライブラリ**: @testing-library/jest-dom 6.6.3
- **DOM実装**: happy-dom

### バックエンド

- **テストランナー**: Deno Test（Deno組み込み）
- **モックライブラリ**: カスタムモック実装

## テスト駆動開発（TDD）

### TDDサイクル

1. **🔴 レッドフェーズ**
   - 失敗するテストを書く
   - 期待される動作を明確に定義

2. **🟢 グリーンフェーズ**
   - テストをパスする最小限のコードを書く
   - 最適化は後回しにする

3. **🔵 リファクタフェーズ**
   - コードをクリーンアップ
   - すべてのテストがパスすることを確認

### TDDの例

```typescript
// 1. レッドフェーズ：失敗するテストを書く
describe('calculateShiftHours', () => {
  it('標準シフトの時間を正しく計算する', () => {
    const result = calculateShiftHours('standard');
    expect(result).toBe(8);
  });
});

// 2. グリーンフェーズ：最小限の実装
function calculateShiftHours(shiftType: string): number {
  return 8;
}

// 3. リファクタフェーズ：実装を改善
function calculateShiftHours(shiftType: ShiftType): number {
  const shiftHours: Record<ShiftType, number> = {
    standard: 8,
    early: 7,
    late: 9,
  };
  return shiftHours[shiftType] ?? 8;
}
```

## テストの実行

### フロントエンド

```bash
cd frontend

# ウォッチモードでテスト実行（開発中推奨）
npm test

# 全テストを一度実行
npm run test:run

# カバレッジ付きでテスト実行
npm run test:coverage

# UIモードでテスト実行（ブラウザで結果を確認）
npm run test:ui

# CI用の完全チェック（lint + type-check + build + test）
npm run ci
```

### バックエンド

```bash
cd supabase/functions

# 特定の関数のテスト実行
deno test process-pdf-single/__tests__/

# 全テスト実行
deno test

# カバレッジ付きでテスト実行
deno test --coverage=coverage
deno coverage coverage --lcov > coverage.lcov
```

## テストの書き方

### 基本構造

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShiftForm } from './ShiftForm';

describe('ShiftForm', () => {
  // セットアップ
  beforeEach(() => {
    // 各テスト前の準備
  });

  // クリーンアップ
  afterEach(() => {
    // 各テスト後の後処理
  });

  // テストケース
  it('フォームを正しく表示する', () => {
    render(<ShiftForm />);
    
    expect(screen.getByLabelText('勤務日')).toBeInTheDocument();
    expect(screen.getByLabelText('シフトタイプ')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '送信' })).toBeInTheDocument();
  });

  it('フォーム送信時にバリデーションを実行する', async () => {
    render(<ShiftForm />);
    
    const submitButton = screen.getByRole('button', { name: '送信' });
    fireEvent.click(submitButton);
    
    expect(await screen.findByText('勤務日を選択してください')).toBeInTheDocument();
  });
});
```

### テストのベストプラクティス

1. **ユーザー視点でテストを書く**
   ```typescript
   // ❌ 実装の詳細をテスト
   expect(component.state.isLoading).toBe(true);
   
   // ✅ ユーザーが見るものをテスト
   expect(screen.getByText('読み込み中...')).toBeInTheDocument();
   ```

2. **アクセシブルなクエリを使用**
   ```typescript
   // 優先順位（高い方が推奨）
   screen.getByRole('button', { name: '送信' });
   screen.getByLabelText('メールアドレス');
   screen.getByPlaceholderText('検索...');
   screen.getByText('こんにちは');
   
   // 最終手段
   screen.getByTestId('custom-element');
   ```

3. **非同期処理を適切に待つ**
   ```typescript
   // findBy*クエリを使用
   const element = await screen.findByText('データが読み込まれました');
   
   // waitForを使用
   await waitFor(() => {
     expect(screen.getByText('更新完了')).toBeInTheDocument();
   });
   ```

## モックとテストデータ

### MSWによるAPIモック

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // シフト一覧取得
  http.get('/api/shifts', () => {
    return HttpResponse.json([
      {
        id: '1',
        date: '2024-05-20',
        shift_type: 'standard',
        user_id: 'user-1',
      },
    ]);
  }),

  // シフト作成
  http.post('/api/shifts', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json({
      id: '2',
      ...data,
      created_at: new Date().toISOString(),
    });
  }),
];
```

### テストデータファクトリー

```typescript
// src/test/mocks/factories.ts
import { Shift, WorkOrder } from '@/types';

export const shiftFactory = {
  create: (overrides?: Partial<Shift>): Shift => ({
    id: '1',
    date: '2024-05-20',
    shift_type: 'standard',
    user_id: 'user-1',
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  createMany: (count: number, overrides?: Partial<Shift>): Shift[] => {
    return Array.from({ length: count }, (_, i) => 
      shiftFactory.create({ id: `${i + 1}`, ...overrides })
    );
  },
};

export const workOrderFactory = {
  create: (overrides?: Partial<WorkOrder>): WorkOrder => ({
    id: 1,
    file_name: 'test.pdf',
    company_name: 'NOHARA_G_MISAWA',
    status: 'pending',
    uploaded_at: new Date().toISOString(),
    ...overrides,
  }),
};
```

### カスタムマッチャー

```typescript
// src/test/matchers.ts
import { expect } from 'vitest';

expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    
    return {
      pass,
      message: () => 
        pass 
          ? `expected ${received} not to be a valid email`
          : `expected ${received} to be a valid email`,
    };
  },
});

// 使用例
expect('test@example.com').toBeValidEmail();
```

## カバレッジ

### カバレッジ目標

- **全体**: 80%以上
- **ビジネスロジック**: 100%
- **ユーティリティ関数**: 100%
- **UIコンポーネント**: 70%以上

### カバレッジレポート

```bash
# カバレッジレポートを生成
npm run test:coverage

# HTMLレポートを開く
npm run test:coverage:open

# CI用のレポートを生成
npm run test:coverage:ci
```

### カバレッジの除外

```typescript
// /* v8 ignore start */ を使用してカバレッジから除外
/* v8 ignore start */
if (process.env.NODE_ENV === 'development') {
  console.log('Development only code');
}
/* v8 ignore stop */

// 単一行の除外
const value = condition ? 'a' : 'b'; // v8 ignore
```

## CI/CD統合

### GitHub Actions設定

`.github/workflows/ci.yml`に以下を追加：

```yaml
- name: Run frontend tests
  working-directory: ./frontend
  run: npm run test:run

- name: Run frontend tests with coverage
  working-directory: ./frontend
  run: npm run test:coverage:ci

- name: Upload coverage reports
  uses: codecov/codecov-action@v4
  with:
    directory: ./frontend/coverage
    flags: frontend
    fail_ci_if_error: true

- name: Run backend tests
  working-directory: ./supabase/functions
  run: |
    deno test --coverage=coverage
    deno coverage coverage --lcov > coverage.lcov

- name: Check coverage thresholds
  working-directory: ./frontend
  run: npm run test:coverage:check
```

### PRコメントへのカバレッジレポート

```yaml
- name: Generate coverage report
  working-directory: ./frontend
  run: npm run coverage:report

- name: Comment PR with coverage
  uses: marocchino/sticky-pull-request-comment@v2
  with:
    path: ./frontend/coverage-report.md
```

## トラブルシューティング

### よくある問題

1. **テストがタイムアウトする**
   ```typescript
   // タイムアウトを延長
   it('長時間かかるテスト', async () => {
     // テストコード
   }, 30000); // 30秒
   ```

2. **MSWハンドラーが動作しない**
   ```typescript
   // setupファイルでサーバーが起動しているか確認
   beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
   afterEach(() => server.resetHandlers());
   afterAll(() => server.close());
   ```

3. **act()警告が出る**
   ```typescript
   // 非同期更新を待つ
   await act(async () => {
     fireEvent.click(button);
   });
   
   // または waitFor を使用
   await waitFor(() => {
     expect(screen.getByText('更新済み')).toBeInTheDocument();
   });
   ```

### デバッグ方法

```typescript
// screen.debug()を使用してDOMを出力
screen.debug();

// 特定の要素のみデバッグ
screen.debug(screen.getByRole('button'));

// prettierフォーマット付き
screen.debug(undefined, Infinity);

// テストの実行をステップ実行
// VS Codeのデバッガーを使用するか、以下を追加
debugger;
```

## テストの優先順位

1. **クリティカルパス**
   - 認証フロー
   - 決済処理
   - データの作成・更新・削除

2. **ビジネスロジック**
   - シフト計算
   - PDF処理
   - 権限チェック

3. **エッジケース**
   - エラーハンドリング
   - バリデーション
   - 境界値

4. **UI/UX**
   - フォーム操作
   - ナビゲーション
   - レスポンシブデザイン

## 参考リンク

- [Vitest ドキュメント](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW ドキュメント](https://mswjs.io/)
- [Testing Library クエリ優先順位](https://testing-library.com/docs/queries/about#priority)
- [Deno Testing](https://docs.deno.com/runtime/fundamentals/testing/)