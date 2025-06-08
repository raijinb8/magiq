# テスト環境設定ガイド

このディレクトリには、プロジェクト全体のテスト環境設定が含まれています。

## テストスクリプト

### 基本コマンド

```bash
# 通常のテスト実行（Watch モード）
npm test

# ワンタイム実行（CI用）
npm run test:run

# ウォッチモード（明示的）
npm run test:watch

# テストUI（ブラウザでテスト結果を確認）
npm run test:ui
```

### カバレッジ関連

```bash
# カバレッジ付きテスト実行
npm run test:coverage

# カバレッジ付きUI
npm run test:coverage:ui

# カバレッジウォッチモード
npm run test:coverage:watch

# カバレッジレポートをブラウザで開く（macOS/Linux）
npm run test:coverage:open

# 詳細レポート生成（閾値チェック付き）
npm run test:coverage:report

# 閾値チェックのみ
npm run test:coverage:threshold
```

#### カバレッジレポート形式

- **HTML**: `coverage/index.html` - ブラウザで閲覧可能な詳細レポート
- **LCOV**: `coverage/lcov.info` - IDE統合用
- **JSON**: `coverage/coverage-final.json` - プログラム処理用
- **XML**: `coverage/clover.xml`, `coverage/cobertura-coverage.xml` - CI/CD用
- **Markdown**: `coverage/pr-comment.md` - PRコメント用

### CI/レポート関連

```bash
# CI用（JUnitレポート付き）
npm run test:ci

# 詳細レポート出力
npm run test:reporter

# デバッグモード
npm run test:debug
```

### フルCI実行

```bash
# lint + type-check + build + test:ci
npm run ci
```

## ファイル構成

### `setup.ts`

グローバルテスト設定とモックが定義されています：

**主要な設定:**

- React Testing Libraryの設定
- Vitestのタイマー設定
- 自動クリーンアップ
- 包括的なブラウザAPIモック

**モックされているAPI:**

- `localStorage` / `sessionStorage`
- `fetch` API
- `location` / `history` API
- `matchMedia` (レスポンシブテスト用)
- `IntersectionObserver` / `ResizeObserver` / `MutationObserver`
- `FileReader` / `URL` API (ファイルアップロード用)
- `Geolocation` / `Clipboard` API
- `Notification` / `ServiceWorker` API
- `Performance` / `AudioContext` API
- `Canvas` / `WebGL` API

### `matchers.ts`

カスタムマッチャーを定義：

```typescript
// 使用例
expect(element).toBeEmptyDOMElement();
expect(container).toHaveErrorMessage('エラーメッセージ');
expect(component).toBeLoadingState();
```

### `utils.tsx`

テストユーティリティ関数：

```typescript
import { render, screen, userEvent } from '@/test/utils';

// React Routerを含むレンダー
const { container } = render(<Component />);

// ユーザーインタラクション
const user = userEvent.setup();
await user.click(button);
```

### `example.test.tsx`

統合テストのサンプル実装

## 使用方法

### 基本的なコンポーネントテスト

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, userEvent } from '@/test/utils';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('正常にレンダリングされる', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('ユーザーインタラクションを処理する', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByText('クリックされました')).toBeInTheDocument();
  });
});
```

### モックの活用

```typescript
// LocalStorageを使用するコンポーネントのテスト
it('LocalStorageにデータを保存する', () => {
  render(<DataSaveComponent />);

  // localStorage.setItemが呼ばれることを確認
  expect(localStorage.setItem).toHaveBeenCalledWith('key', 'value');
});

// Fetch APIを使用するコンポーネントのテスト
it('データを取得する', async () => {
  const mockData = { message: 'Success' };
  (global.fetch as unknown as vi.Mock).mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(mockData),
  });

  render(<DataFetchComponent />);
  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

### 非同期処理のテスト

```typescript
import { waitFor, waitForElementToBeRemoved } from '@/test/utils';

it('ローディング状態を正しく表示する', async () => {
  render(<AsyncComponent />);

  // ローディングが表示される
  expect(screen.getByText('読み込み中...')).toBeInTheDocument();

  // ローディングが消える
  await waitForElementToBeRemoved(() => screen.queryByText('読み込み中...'));

  // 結果が表示される
  expect(screen.getByText('データ読み込み完了')).toBeInTheDocument();
});
```

## ベストプラクティス

1. **テストファイル命名**: `*.test.tsx` または `*.spec.tsx`
2. **テストID**: `data-testid` 属性を使用
3. **アクセシビリティ**: role、label、textContentでの要素取得を優先
4. **モックのクリア**: 自動的に実行されるため手動クリア不要
5. **タイマー**: Fake Timersが自動設定されるため`vi.advanceTimersByTime()`使用可能

## 設定のカスタマイズ

プロジェクト固有の設定が必要な場合は、`setup.ts`を編集してください：

```typescript
// 特定のAPIの動作を変更
beforeAll(() => {
  // カスタムモック設定
  Object.defineProperty(window, 'customAPI', {
    value: vi.fn().mockReturnValue('custom value'),
    writable: true,
  });
});
```

このテスト環境により、フロントエンド開発の品質と信頼性が大幅に向上します。
