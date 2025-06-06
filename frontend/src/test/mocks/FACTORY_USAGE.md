# テストデータファクトリー使用ガイド

このファイルでは、`factories.ts`で提供されるテストデータファクトリーの使用方法を説明します。

## 概要

テストデータファクトリーは、一貫性のあるテストデータを簡単に生成するためのツールです。以下の利点があります：

- **一貫性**: 同じ構造のデータを常に生成
- **柔軟性**: 必要に応じて値をオーバーライド可能
- **保守性**: データ構造変更時の影響を最小化
- **効率性**: 複雑なテストシナリオを簡単に構築

## 基本的な使用方法

### 単一データの生成

```typescript
import { 
  createMockUser, 
  createMockWorkOrder, 
  createMockShift 
} from './mocks/factories';

// デフォルト値でユーザーを作成
const user = createMockUser();
// { id: 'user-1', email: 'test-abc123@example.com', role: 'user', ... }

// 特定の値をオーバーライド
const adminUser = createMockUser({
  email: 'admin@company.com',
  role: 'admin'
});

// ワークオーダーの作成
const workOrder = createMockWorkOrder({
  status: 'processing',
  company_name: '野原G住環境'
});
```

### 複数データの生成

```typescript
import { 
  createMockUsers, 
  createMockWorkOrders,
  createMockShifts 
} from './mocks/factories';

// 5人のユーザーを作成
const users = createMockUsers(5);

// 3つのエラー状態のワークオーダーを作成
const errorWorkOrders = createMockWorkOrders(3, { 
  status: 'error',
  error_message: 'テスト用エラー' 
});

// 週間シフトの生成
const weeklyShifts = createMockShifts(7, { 
  user_id: 'user-123',
  shift_type: 'morning' 
});
```

## 特殊パターンの使用

### 会社別データ

```typescript
import { createMockWorkOrderForCompany } from './mocks/factories';

// 野原G住環境のワークオーダー
const noharaWorkOrder = createMockWorkOrderForCompany('NOHARA_G');

// 加藤ベニヤのワークオーダー
const katouWorkOrder = createMockWorkOrderForCompany('KATOUBENIYA_MISAWA');
```

### エラー状態データ

```typescript
import { 
  createMockWorkOrderWithError,
  createMockWorkOrderProcessing 
} from './mocks/factories';

// エラー状態のワークオーダー
const errorOrder = createMockWorkOrderWithError('PDF処理に失敗しました');

// 処理中のワークオーダー
const processingOrder = createMockWorkOrderProcessing();
```

### 関連データセット

```typescript
import { 
  createMockUserWithRelatedData,
  createMockWeeklyShifts 
} from './mocks/factories';

// ユーザーとその関連データを一括生成
const { user, workOrders, shifts } = createMockUserWithRelatedData({
  role: 'admin'
});

// 特定の週のシフトスケジュール
const weekShifts = createMockWeeklyShifts('user-123', '2025-06-06');
```

## APIレスポンスの生成

### 認証レスポンス

```typescript
import { createMockAuthResponse } from './mocks/factories';

// デフォルトユーザーでの認証レスポンス
const authResponse = createMockAuthResponse();

// 特定のユーザーでの認証レスポンス
const customUser = createMockUser({ email: 'test@example.com' });
const customAuthResponse = createMockAuthResponse(customUser);
```

### PDF処理レスポンス

```typescript
import { createMockPdfProcessingResponse } from './mocks/factories';

// 成功レスポンス
const successResponse = createMockPdfProcessingResponse({
  generatedText: 'カスタムテキスト',
  processingTime: 2000
});

// 失敗レスポンス
const errorResponse = createMockPdfProcessingResponse({
  success: false,
  generatedText: ''
});
```

### Supabaseレスポンス

```typescript
import { createMockSupabaseResponse } from './mocks/factories';

// 成功レスポンス
const data = [createMockWorkOrder(), createMockWorkOrder()];
const successResponse = createMockSupabaseResponse(data);

// エラーレスポンス
const errorResponse = createMockSupabaseResponse([], true);
```

## テストでの実用例

### MSWハンドラーでの使用

```typescript
import { http, HttpResponse } from 'msw';
import { createMockPdfProcessingResponse } from './factories';

export const handlers = [
  http.post('*/functions/v1/process-pdf-single', () => {
    const response = createMockPdfProcessingResponse({
      generatedText: 'モック処理結果',
      processingTime: 1500
    });
    return HttpResponse.json(response);
  }),
];
```

### コンポーネントテストでの使用

```typescript
import { render, screen } from '@testing-library/react';
import { createMockWorkOrder } from './mocks/factories';
import WorkOrderCard from '../components/WorkOrderCard';

describe('WorkOrderCard', () => {
  it('完了状態のワークオーダーを表示する', () => {
    const workOrder = createMockWorkOrder({
      status: 'completed',
      company_name: 'テスト会社',
      generated_text: 'テスト内容'
    });

    render(<WorkOrderCard workOrder={workOrder} />);
    
    expect(screen.getByText('テスト会社')).toBeInTheDocument();
    expect(screen.getByText('テスト内容')).toBeInTheDocument();
  });

  it('エラー状態のワークオーダーを表示する', () => {
    const errorOrder = createMockWorkOrderWithError('処理エラーが発生');

    render(<WorkOrderCard workOrder={errorOrder} />);
    
    expect(screen.getByText('処理エラーが発生')).toBeInTheDocument();
  });
});
```

### 統合テストでの使用

```typescript
import { createMockFullDataset, testPresets } from './mocks/factories';

describe('ダッシュボード統合テスト', () => {
  it('完全なデータセットでダッシュボードが正常に動作する', () => {
    const dataset = createMockFullDataset();
    
    // データセットをモックAPIに設定
    setupMockAPI(dataset);
    
    render(<Dashboard />);
    
    // ユーザー数の確認
    expect(screen.getByText(`${dataset.users.length}人のユーザー`)).toBeInTheDocument();
  });

  it('新規ユーザーの場合は空の状態を表示する', () => {
    const newUserData = testPresets.newUser();
    
    setupMockAPI(newUserData);
    
    render(<Dashboard />);
    
    expect(screen.getByText('データがありません')).toBeInTheDocument();
  });
});
```

## プリセットの活用

### 既定のテストシナリオ

```typescript
import { testPresets } from './mocks/factories';

describe('ユーザータイプ別テスト', () => {
  it('新規ユーザーのテスト', () => {
    const scenario = testPresets.newUser();
    // scenario.user, scenario.workOrders (空), scenario.shifts (空)
  });

  it('アクティブユーザーのテスト', () => {
    const scenario = testPresets.activeUser();
    // scenario.user, scenario.workOrders (10件), scenario.shifts (20件)
  });

  it('問題のあるユーザーのテスト', () => {
    const scenario = testPresets.problematicUser();
    // エラー状態のワークオーダーとキャンセルされたシフト
  });
});
```

### 企業別テスト

```typescript
import { testPresets } from './mocks/factories';

describe('企業別機能テスト', () => {
  it('各企業のワークオーダー形式をテスト', () => {
    const companies = testPresets.companySpecificData();
    
    expect(companies.noharaG.generated_text).toContain('グリーンマンション');
    expect(companies.katoubeniya.generated_text).toContain('池袋新築現場');
  });
});
```

## ベストプラクティス

### 1. テスト間でのデータの独立性

```typescript
import { resetFactorySequences } from './mocks/factories';

describe('テストスイート', () => {
  beforeEach(() => {
    // 各テスト前にシーケンスをリセット
    resetFactorySequences();
  });

  it('テスト1', () => {
    const user = createMockUser(); // id: 'user-1'
  });

  it('テスト2', () => {
    const user = createMockUser(); // id: 'user-1' (リセットされているため)
  });
});
```

### 2. 意味のあるテストデータ

```typescript
// ❌ 悪い例：テストの目的が不明
const user = createMockUser();

// ✅ 良い例：テストの意図が明確
const adminUser = createMockUser({
  role: 'admin',
  email: 'admin@company.com'
});
```

### 3. 適切なオーバーライド

```typescript
// ❌ 悪い例：不必要な詳細指定
const workOrder = createMockWorkOrder({
  id: 999,
  file_name: 'very-specific-name.pdf',
  uploaded_at: '2025-06-06T10:30:00.000Z',
  // ... 他の不必要な詳細
});

// ✅ 良い例：テストに必要な部分のみ指定
const errorWorkOrder = createMockWorkOrder({
  status: 'error',
  error_message: 'テスト用エラー'
});
```

### 4. 読みやすいテストコード

```typescript
describe('ワークオーダー処理', () => {
  it('正常なPDFファイルを処理できる', () => {
    // Given: 正常なワークオーダー
    const workOrder = createMockWorkOrder({
      status: 'pending',
      file_name: 'valid-document.pdf'
    });

    // When: 処理を実行
    const result = processWorkOrder(workOrder);

    // Then: 正常に完了
    expect(result.status).toBe('completed');
  });
});
```

## ヘルパー関数の活用

### ランダムヘルパー

```typescript
import { randomHelpers } from './mocks/factories';

// テスト用のランダムデータ生成
const testEmail = randomHelpers.email();
const testString = randomHelpers.string(12);
const randomCompany = randomHelpers.arrayElement(['NOHARA_G', 'KATOUBENIYA_MISAWA']);
```

### 日付ヘルパー

```typescript
import { dateHelpers } from './mocks/factories';

// 日付関連のテストデータ
const today = dateHelpers.today();
const futureDate = dateHelpers.daysFromNow(7);
const pastDate = dateHelpers.daysFromNow(-30);
```

## トラブルシューティング

### よくある問題

1. **型エラー**: TypeScriptの型定義と実際のデータ構造が合わない
   - 解決: `src/types/index.ts`の型定義を確認・更新

2. **テスト間でのデータ混在**: 前のテストのデータが影響している
   - 解決: `beforeEach`で`resetFactorySequences()`を呼び出し

3. **非現実的なテストデータ**: 実際のデータと乖離したテストデータ
   - 解決: プロダクションデータを参考にファクトリーを調整

### デバッグのヒント

```typescript
// 生成されたデータの確認
const workOrder = createMockWorkOrder();
console.log('Generated work order:', workOrder);

// シーケンスの確認
resetFactorySequences();
const user1 = createMockUser();
const user2 = createMockUser();
console.log('Sequential IDs:', user1.id, user2.id); // user-1, user-2
```