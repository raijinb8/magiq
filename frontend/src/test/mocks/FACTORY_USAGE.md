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

## 高度な使用パターン

### カスタムファクトリーの作成

```typescript
import { createMockUser, randomHelpers, dateHelpers } from './mocks/factories';

// プロジェクト固有のユーザーファクトリー
function createProjectManager(projectName: string) {
  return createMockUser({
    role: 'admin',
    email: `manager-${randomHelpers.string(6)}@company.com`,
    user_metadata: {
      projects: [projectName],
      joinedAt: dateHelpers.daysFromNow(-365), // 1年前に参加
      isProjectManager: true
    }
  });
}

// 使用例
const manager = createProjectManager('グリーンマンション建設');
expect(manager.user_metadata.isProjectManager).toBe(true);
expect(manager.user_metadata.projects).toContain('グリーンマンション建設');
```

### 条件付きデータ生成

```typescript
function createConditionalWorkOrders(count: number, condition: 'success' | 'error' | 'mixed') {
  const workOrders = [];
  
  for (let i = 0; i < count; i++) {
    let workOrder;
    
    switch (condition) {
      case 'success':
        workOrder = createMockWorkOrder({
          status: 'completed',
          generated_text: `成功事例 ${i + 1}の処理結果`
        });
        break;
        
      case 'error':
        workOrder = createMockWorkOrderWithError(`エラー事例 ${i + 1}: 処理失敗`);
        break;
        
      case 'mixed':
        workOrder = i % 2 === 0 
          ? createMockWorkOrder({ status: 'completed' })
          : createMockWorkOrderWithError(`エラー事例 ${i + 1}`);
        break;
    }
    
    workOrders.push(workOrder);
  }
  
  return workOrders;
}

// 使用例
const successWorkOrders = createConditionalWorkOrders(5, 'success');
const mixedWorkOrders = createConditionalWorkOrders(10, 'mixed');

expect(successWorkOrders.every(wo => wo.status === 'completed')).toBe(true);
expect(mixedWorkOrders.filter(wo => wo.status === 'error')).toHaveLength(5);
```

### パフォーマンステスト用データ生成

```typescript
describe('大量データパフォーマンステスト', () => {
  it('1000件のワークオーダーを効率的に処理できる', () => {
    const startTime = performance.now();
    
    // 大量データの生成
    const largeDataset = createMockWorkOrders(1000, {
      company_name: '野原G住環境'
    });
    
    const generationTime = performance.now() - startTime;
    
    // データ生成が1秒以内であることを確認
    expect(generationTime).toBeLessThan(1000);
    expect(largeDataset).toHaveLength(1000);
    
    // メモリ使用量の確認（ブラウザ環境では制限あり）
    const dataSize = JSON.stringify(largeDataset).length;
    console.log(`Generated ${largeDataset.length} records in ${generationTime}ms, size: ${dataSize} bytes`);
  });

  it('メモリ効率的なファクトリー使用', () => {
    // 必要な場合のみ詳細データを生成
    const lightweightOrders = createMockWorkOrders(100, {
      // 必要最小限のデータのみ設定
      status: 'pending',
      generated_text: '', // 重いテキストデータは空に
      edited_text: null
    });

    expect(lightweightOrders).toHaveLength(100);
    expect(lightweightOrders[0].generated_text).toBe('');
  });
});
```

### 階層データの生成

```typescript
// 組織階層のテストデータ
function createOrganizationalData() {
  // 管理者ユーザー
  const admin = createMockUser({
    role: 'admin',
    email: 'admin@company.com'
  });

  // マネージャーユーザー（複数）
  const managers = createMockUsers(3, {
    role: 'manager',
    user_metadata: { reportsTo: admin.id }
  });

  // 一般ユーザー（各マネージャーに3人ずつ）
  const staffMembers = managers.flatMap(manager => 
    createMockUsers(3, {
      role: 'user',
      user_metadata: { reportsTo: manager.id }
    })
  );

  // 各スタッフのワークオーダー
  const allWorkOrders = staffMembers.flatMap(staff =>
    createMockWorkOrders(randomHelpers.arrayElement([2, 3, 4]), {
      user_id: staff.id,
      company_name: '野原G住環境'
    })
  );

  return {
    admin,
    managers,
    staffMembers,
    workOrders: allWorkOrders,
    totalUsers: 1 + managers.length + staffMembers.length
  };
}

// 使用例
describe('組織階層テスト', () => {
  it('組織全体のデータが正しく生成される', () => {
    const org = createOrganizationalData();
    
    expect(org.admin.role).toBe('admin');
    expect(org.managers).toHaveLength(3);
    expect(org.staffMembers).toHaveLength(9); // 3 managers × 3 staff each
    expect(org.totalUsers).toBe(13); // 1 admin + 3 managers + 9 staff
    
    // 各スタッフが管理者に紐づいている
    org.staffMembers.forEach(staff => {
      expect(org.managers.some(manager => 
        manager.id === staff.user_metadata.reportsTo
      )).toBe(true);
    });
  });
});
```

### テストシナリオ別ファクトリー

```typescript
// シナリオ別のデータセット生成
const testScenarios = {
  // 新規システム導入時のテスト
  freshInstall: () => ({
    users: [createMockUser({ role: 'admin', email: 'admin@newcompany.com' })],
    workOrders: [],
    shifts: []
  }),

  // 運用中のシステムテスト
  activeProduction: () => {
    const users = createMockUsers(20);
    const workOrders = createMockWorkOrders(50, {
      status: randomHelpers.arrayElement(['completed', 'processing', 'pending'])
    });
    const shifts = createMockShifts(100);
    
    return { users, workOrders, shifts };
  },

  // 障害復旧後のテスト
  postIncident: () => {
    const users = createMockUsers(10);
    const workOrders = [
      ...createMockWorkOrders(5, { status: 'completed' }), // 正常分
      ...createMockWorkOrders(3, { status: 'error', error_message: '障害による処理失敗' }), // 障害分
      ...createMockWorkOrders(2, { status: 'pending' }) // 再処理待ち
    ];
    
    return { users, workOrders, shifts: [] };
  },

  // 高負荷状況のテスト
  highLoad: () => ({
    users: createMockUsers(100),
    workOrders: createMockWorkOrders(500, {
      status: 'processing',
      uploaded_at: dateHelpers.today() // 今日の日付に集中
    }),
    shifts: createMockShifts(200)
  })
};

// 使用例
describe('シナリオ別テスト', () => {
  it('新規導入環境で正しく動作する', () => {
    const scenario = testScenarios.freshInstall();
    
    expect(scenario.users).toHaveLength(1);
    expect(scenario.users[0].role).toBe('admin');
    expect(scenario.workOrders).toHaveLength(0);
  });

  it('高負荷環境でも安定動作する', () => {
    const scenario = testScenarios.highLoad();
    
    expect(scenario.users.length).toBeGreaterThan(50);
    expect(scenario.workOrders.length).toBeGreaterThan(400);
    
    // 今日の日付のデータが多いことを確認
    const todayOrders = scenario.workOrders.filter(wo => 
      wo.uploaded_at.startsWith(dateHelpers.today().toISOString().split('T')[0])
    );
    expect(todayOrders.length).toBeGreaterThan(400);
  });
});
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