# テスト環境ガイド

このディレクトリには、MagIQプロジェクトのテスト環境設定と共通ユーティリティが含まれています。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install --save-dev vitest @vitest/ui happy-dom @testing-library/react @testing-library/user-event @testing-library/jest-dom msw @vitest/coverage-v8
```

### 2. テストの実行

```bash
# テストを実行（ウォッチモード）
npm test

# UIモードでテストを実行
npm run test:ui

# カバレッジレポート付きでテストを実行
npm run test:coverage
```

## ディレクトリ構造

```
src/test/
├── setup.ts          # テスト環境のグローバル設定
├── utils.tsx         # テスト用ユーティリティとカスタムrender関数
├── mocks/
│   ├── handlers.ts   # MSWモックハンドラー定義
│   └── server.ts     # MSWサーバー設定
└── README.md         # このファイル
```

## テストの書き方

### 基本的なユニットテスト

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myFunction';

describe('myFunction', () => {
  it('期待される動作を処理する', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### Reactコンポーネントのテスト

```typescript
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('ユーザー操作を正しく処理する', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(screen.getByText('Updated text')).toBeInTheDocument();
  });
});
```

### カスタムフックのテスト

```typescript
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from './useMyHook';

describe('useMyHook', () => {
  it('状態を正しく更新する', () => {
    const { result } = renderHook(() => useMyHook());
    
    act(() => {
      result.current.updateState('new value');
    });
    
    expect(result.current.state).toBe('new value');
  });
});
```

### API呼び出しのテスト（MSW使用）

MSWハンドラーは `src/test/mocks/handlers.ts` で定義されており、テスト実行時に自動的に有効になります。

```typescript
import { getUser } from './api';

describe('API calls', () => {
  it('ユーザーデータを取得する', async () => {
    // MSWハンドラーが自動的にリクエストをインターセプト
    const user = await getUser('test-id');
    
    expect(user).toEqual({
      id: 'mock-user-id',
      email: 'test@example.com',
    });
  });
});
```

## テスト戦略

### TDD (Test-Driven Development)

1. **レッドフェーズ**: 失敗するテストを書く
2. **グリーンフェーズ**: テストをパスする最小限のコードを書く
3. **リファクタフェーズ**: コードを改善する

### テストの優先順位

1. ビジネスロジックのユニットテスト
2. 重要なUIコンポーネントのテスト
3. カスタムフックのテスト
4. API統合テスト

### カバレッジ目標

- 全体: 80%以上
- ビジネスロジック: 100%
- UIコンポーネント: 70%以上

## よく使うマッチャー

### Vitest標準マッチャー

- `toBe()`: 厳密等価
- `toEqual()`: 深い等価
- `toContain()`: 配列・文字列に含まれる
- `toThrow()`: エラーがスローされる
- `toHaveBeenCalled()`: 関数が呼ばれた

### jest-domマッチャー

- `toBeInTheDocument()`: DOM内に存在
- `toHaveClass()`: CSSクラスを持つ
- `toHaveAttribute()`: 属性を持つ
- `toBeDisabled()`: 無効化されている
- `toHaveTextContent()`: テキストを含む

## モック

### グローバルモック（setup.tsで定義済み）

- `window.matchMedia`: メディアクエリ
- `IntersectionObserver`: 交差監視
- `ResizeObserver`: サイズ変更監視
- PDFワーカー: react-pdf用
- 環境変数: Supabase接続情報

### 関数のモック

```typescript
import { vi } from 'vitest';

const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');
mockFn.mockResolvedValue('async mocked value');
```

### モジュールのモック

```typescript
vi.mock('./myModule', () => ({
  myFunction: vi.fn().mockReturnValue('mocked'),
}));
```

## トラブルシューティング

### よくある問題

1. **"Cannot find module" エラー**
   - `@/` エイリアスが正しく設定されているか確認
   - `tsconfig.json` のパス設定を確認

2. **非同期テストのタイムアウト**
   - `async/await` を適切に使用
   - `act()` でラップが必要な場合がある

3. **MSWハンドラーが動作しない**
   - URLパターンが正しいか確認
   - リクエストヘッダーを確認

4. **React Testing Libraryのクエリが要素を見つけられない**
   - 非同期レンダリングの場合は `findBy*` を使用
   - アクセシビリティロールを確認

## 参考リンク

- [Vitest ドキュメント](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [MSW (Mock Service Worker)](https://mswjs.io/)
- [jest-dom](https://github.com/testing-library/jest-dom)