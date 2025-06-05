# TDD開発ガイド

このガイドでは、MagIQプロジェクトでのTest-Driven Development（TDD）の実践方法を説明します。

## 🎯 TDD基本サイクル

### Red-Green-Refactor サイクル

```
1. 🔴 RED: 失敗するテストを書く
2. 🟢 GREEN: テストを通す最小限のコードを書く  
3. 🔵 REFACTOR: コードを改善する
```

## 📋 開発フロー

### 新機能開発時

#### 1. 開発開始前
```bash
# 最新のdevブランチから開始
git checkout dev && git pull origin dev

# 機能ブランチを作成
git checkout -b feature/user-profile-edit

# テストウォッチモードを起動（開発中は常に実行）
npm test
```

#### 2. TDDサイクルの実行

**🔴 Step 1: RED - 失敗するテストを書く**
```typescript
// src/components/UserProfile/UserProfile.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, userEvent } from '@/test/utils';
import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
  it('編集ボタンをクリックすると編集モードになる', async () => {
    const user = userEvent.setup();
    render(<UserProfile />);
    
    const editButton = screen.getByRole('button', { name: '編集' });
    await user.click(editButton);
    
    // まだ実装していないので失敗する
    expect(screen.getByText('編集モード')).toBeInTheDocument();
  });
});
```

**確認：テストが失敗することを確認**
```bash
# ウォッチモードで自動実行されるか、手動で確認
npm run test:run src/components/UserProfile/UserProfile.test.tsx
```

**🟢 Step 2: GREEN - 最小限の実装**
```typescript
// src/components/UserProfile/UserProfile.tsx
import { useState } from 'react';

export function UserProfile() {
  const [isEditing, setIsEditing] = useState(false);
  
  return (
    <div>
      <button onClick={() => setIsEditing(true)}>編集</button>
      {isEditing && <div>編集モード</div>}
    </div>
  );
}
```

**確認：テストが成功することを確認**

**🔵 Step 3: REFACTOR - コードの改善**
```typescript
// より良い実装にリファクタリング
export function UserProfile() {
  const [isEditing, setIsEditing] = useState(false);
  
  const handleEditToggle = () => setIsEditing(!isEditing);
  
  return (
    <div className="user-profile">
      <button 
        onClick={handleEditToggle}
        aria-pressed={isEditing}
      >
        {isEditing ? '保存' : '編集'}
      </button>
      {isEditing ? (
        <EditForm />
      ) : (
        <DisplayView />
      )}
    </div>
  );
}
```

#### 3. 開発完了時
```bash
# 全テストの実行
npm run test:run

# カバレッジ確認
npm run test:coverage

# 品質チェック
npm run ci

# コミット
git add .
git commit -m "feat: ユーザープロフィール編集機能を追加"
git push origin feature/user-profile-edit
```

### バグ修正時

#### 1. バグ再現テストの作成
```typescript
// バグを再現するテストから開始
it('特定の条件でエラーが発生する問題', () => {
  render(<ProblematicComponent />);
  
  // バグの状況を再現
  const button = screen.getByRole('button');
  expect(button).toBeEnabled(); // 現在は失敗する
});
```

#### 2. 修正の実装
```typescript
// バグを修正
function ProblematicComponent() {
  // 修正されたロジック
}
```

#### 3. テスト成功を確認
```bash
npm run test:run
```

## ⏰ テスト実行のタイミング

### 常時実行（推奨）
```bash
# 開発開始時に起動して常に実行
npm test
```

### 特定のタイミングでの実行

**コード変更後：**
```bash
# 関連テストのみ実行（自動）
# Vitestが変更を検知して自動実行
```

**コミット前：**
```bash
# 全テスト実行
npm run test:run

# CI相当のチェック
npm run ci
```

**PR作成前：**
```bash
# カバレッジレポート生成
npm run test:coverage:report

# 詳細確認
npm run test:ui
```

**デバッグ時：**
```bash
# デバッガー付きで実行
npm run test:debug

# 特定のテストのみ実行
npm test -- --run src/components/UserProfile
```

## 📊 カバレッジ管理

### 開発中のカバレッジ確認
```bash
# リアルタイムカバレッジ
npm run test:coverage:watch

# ブラウザで詳細確認
npm run test:coverage:ui
```

### 目標カバレッジ
- **新規コード**: 95%以上
- **既存コード改修**: 80%以上
- **レガシーコード**: 段階的改善

### カバレッジが低い場合の対処
1. **Edge Caseのテスト追加**
2. **Error Handlingのテスト**
3. **統合テストの追加**

## 🛠️ よく使うテストパターン

### 1. コンポーネントのレンダリング
```typescript
it('必要な要素が表示される', () => {
  render(<MyComponent />);
  
  expect(screen.getByRole('heading')).toBeInTheDocument();
  expect(screen.getByText('期待するテキスト')).toBeInTheDocument();
});
```

### 2. ユーザーインタラクション
```typescript
it('ボタンクリックで状態が変わる', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);
  
  await user.click(screen.getByRole('button', { name: 'クリック' }));
  
  expect(screen.getByText('変更後のテキスト')).toBeInTheDocument();
});
```

### 3. 非同期処理
```typescript
it('データ読み込み後に結果を表示', async () => {
  render(<AsyncComponent />);
  
  // ローディング確認
  expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  
  // 結果の表示を待機
  await waitFor(() => {
    expect(screen.getByText('データ読み込み完了')).toBeInTheDocument();
  });
});
```

### 4. Error Boundary
```typescript
it('エラー時にエラーメッセージを表示', () => {
  const ThrowError = () => { throw new Error('Test error'); };
  
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );
  
  expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
});
```

### 5. カスタムフック
```typescript
it('カスタムフックの動作確認', () => {
  const { result } = renderHook(() => useCustomHook());
  
  expect(result.current.value).toBe('初期値');
  
  act(() => {
    result.current.setValue('新しい値');
  });
  
  expect(result.current.value).toBe('新しい値');
});
```

## 🚫 テスト時の注意点

### やってはいけないこと
1. **実装の詳細をテストする**
   ```typescript
   // ❌ 悪い例：内部状態をテスト
   expect(component.state.internalValue).toBe(true);
   
   // ✅ 良い例：ユーザーから見える動作をテスト
   expect(screen.getByText('有効')).toBeInTheDocument();
   ```

2. **テストでのみ使用される属性を追加**
   ```typescript
   // ❌ 悪い例
   <div data-test="my-component">
   
   // ✅ 良い例
   <div role="main" aria-label="メインコンテンツ">
   ```

3. **テスト間での状態共有**
   ```typescript
   // ❌ 悪い例：テスト間で変数を共有
   let sharedState;
   
   // ✅ 良い例：各テストで独立してセットアップ
   beforeEach(() => {
     // 各テストで初期化
   });
   ```

### 推奨プラクティス
1. **テスト名は動作を説明する**
   ```typescript
   // ✅ 良い例
   it('無効なメールアドレスを入力するとエラーメッセージを表示する', () => {});
   
   // ❌ 悪い例
   it('emailValidation test', () => {});
   ```

2. **Arrange-Act-Assert パターン**
   ```typescript
   it('ユーザー情報を更新する', async () => {
     // Arrange: 準備
     const user = userEvent.setup();
     render(<UserForm />);
     
     // Act: 実行
     await user.type(screen.getByLabelText('名前'), '新しい名前');
     await user.click(screen.getByRole('button', { name: '保存' }));
     
     // Assert: 検証
     expect(screen.getByText('保存しました')).toBeInTheDocument();
   });
   ```

## 🔧 トラブルシューティング

### テストが不安定な場合
```typescript
// 非同期処理を適切に待機
await waitFor(() => {
  expect(screen.getByText('期待する結果')).toBeInTheDocument();
}, { timeout: 5000 });

// タイマーを使用する場合
vi.useFakeTimers();
// ... テスト実行
vi.runAllTimers();
vi.useRealTimers();
```

### カバレッジが期待通りでない場合
```bash
# 詳細なカバレッジレポートを確認
npm run test:coverage:report

# HTMLレポートで具体的な未カバー箇所を確認
npm run test:coverage:open
```

### テストが遅い場合
```bash
# 並列実行の最適化
npm test -- --reporter=verbose --threads

# 特定のテストのみ実行
npm test -- src/components/specific-component
```

## 📈 継続的改善

### 定期的な見直し
- **月次**: テストカバレッジレビュー
- **スプリント毎**: テストの実行時間とメンテナンス性確認
- **リリース前**: E2Eテストの追加検討

### メトリクス監視
- テスト成功率（目標: 100%）
- カバレッジ率（目標: 80%以上）
- テスト実行時間（目標: 2分以内）

このガイドに従うことで、高品質で保守しやすいコードを効率的に開発できます。