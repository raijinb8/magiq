# 🚀 クイックスタートガイド

新しい開発者向けの簡単セットアップガイドです。

## ⚡ 5分でテスト環境を試す

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd magiq/frontend
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. テスト実行

```bash
# すぐにテストを試す
npm test

# サンプルテストが5個実行されることを確認
# ✓ 5 passed (5)
```

### 4. カバレッジレポート

```bash
# HTMLカバレッジレポートを生成
npm run test:coverage

# ブラウザで確認（macOS/Linux）
npm run test:coverage:open
```

### 5. テストUIの確認

```bash
# ブラウザベースのテストUI
npm run test:ui

# http://localhost:51204 でUIが開く
```

## 📝 最初のテストを書く

### 1. テストファイルの作成

```bash
# 新しいコンポーネント用テストを作成
touch src/components/HelloWorld/HelloWorld.test.tsx
```

### 2. テストの記述

```typescript
// src/components/HelloWorld/HelloWorld.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';

describe('HelloWorld', () => {
  it('Hello Worldと表示される', () => {
    // まだコンポーネントがないので失敗する（RED）
    render(<HelloWorld />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
```

### 3. コンポーネントの実装

```typescript
// src/components/HelloWorld/HelloWorld.tsx
export function HelloWorld() {
  return <div>Hello World</div>;
}
```

### 4. テストの成功確認

```bash
npm test HelloWorld.test.tsx
# ✓ HelloWorld > Hello Worldと表示される
```

## 🎯 実際のTDD例

### User Story: 「カウンターボタン」

ユーザーがボタンをクリックすると数字が増える機能

#### Step 1: 🔴 RED - 失敗するテストを書く

```typescript
// src/components/Counter/Counter.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, userEvent } from '@/test/utils';
import { Counter } from './Counter';

describe('Counter', () => {
  it('初期値は0を表示する', () => {
    render(<Counter />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('ボタンをクリックすると数字が1増える', async () => {
    const user = userEvent.setup();
    render(<Counter />);

    const button = screen.getByRole('button', { name: 'カウント' });
    await user.click(button);

    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
```

#### Step 2: 🟢 GREEN - 最小限の実装

```typescript
// src/components/Counter/Counter.tsx
import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <div>{count}</div>
      <button onClick={() => setCount(count + 1)}>
        カウント
      </button>
    </div>
  );
}
```

#### Step 3: 🔵 REFACTOR - 改善

```typescript
// よりアクセシブルで保守しやすい実装
export function Counter() {
  const [count, setCount] = useState(0);

  const handleIncrement = () => setCount(prev => prev + 1);

  return (
    <div className="counter">
      <div aria-live="polite" role="status">
        現在のカウント: {count}
      </div>
      <button
        onClick={handleIncrement}
        aria-label={`カウントを増やす。現在: ${count}`}
      >
        カウント
      </button>
    </div>
  );
}
```

## 🛠️ よく使うコマンド

### 開発中

```bash
npm test                    # ファイル変更時に自動実行
npm run test:coverage:watch # カバレッジ付きウォッチ
npm run test:ui            # ブラウザUI
```

### コミット前

```bash
npm run test:run           # 全テスト実行
npm run ci                 # 品質チェック
```

### デバッグ

```bash
npm run test:debug         # デバッガー付きで実行
npm test -- --reporter=verbose  # 詳細な出力
```

### 特定のテストのみ

```bash
npm test Counter           # Counterに関するテストのみ
npm test -- --run src/components/specific-test.tsx
```

## 🔧 トラブルシューティング

### テストが見つからない場合

```bash
# パターンを確認
npm test -- --reporter=verbose

# ファイル名の確認
ls src/**/*.test.tsx
```

### カバレッジが0%の場合

```bash
# include/exclude設定を確認
npm run test:coverage:report
```

### テストが遅い場合

```bash
# 並列実行の設定
npm test -- --threads --reporter=verbose
```

### モックが効かない場合

```typescript
// setup.tsでモックが正しく設定されているか確認
import { vi } from 'vitest';

// 手動モック
vi.mock('module-name', () => ({
  default: vi.fn(),
}));
```

## 📚 次のステップ

1. **[TDD開発ガイド](TDD_GUIDE.md)** - 詳細な開発フロー
2. **[テスト環境設定](../src/test/README.md)** - 技術詳細
3. **既存のテスト** - `src/test/example.test.tsx`を参考に

## 🎉 おめでとうございます！

これでMagIQプロジェクトでのTDD開発を始める準備が整いました。

**覚えておくこと:**

- `npm test`を開発中は常に実行
- Red → Green → Refactor のサイクルを意識
- ユーザーの視点でテストを書く
- コミット前に`npm run ci`で品質確認

Happy Testing! 🚀
