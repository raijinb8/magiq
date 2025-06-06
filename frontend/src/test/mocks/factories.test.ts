/**
 * テストデータファクトリーのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // ヘルパー関数
  resetFactorySequences,
  randomHelpers,
  dateHelpers,
  
  // 基本ファクトリー
  createMockUser,
  createMockWorkOrder,
  createMockShift,
  
  // 複数データ生成
  createMockUsers,
  createMockWorkOrders,
  
  // 特殊パターン
  createMockWorkOrderForCompany,
  createMockWorkOrderWithError,
  createMockWorkOrderProcessing,
  createMockUserWithRelatedData,
  createMockWeeklyShifts,
  
  // APIレスポンス
  createMockAuthResponse,
  createMockPdfProcessingResponse,
  createMockErrorResponse,
  createMockSupabaseResponse,
  
  // プリセット
  createMockFullDataset,
  testPresets,
} from './factories';

describe('ヘルパー関数', () => {
  beforeEach(() => {
    resetFactorySequences();
  });

  describe('randomHelpers', () => {
    it('指定した長さの文字列を生成できる', () => {
      const str = randomHelpers.string(10);
      expect(str).toHaveLength(10);
      expect(typeof str).toBe('string');
    });

    it('ランダムなメールアドレスを生成できる', () => {
      const email = randomHelpers.email();
      expect(email).toMatch(/^test-.+@example\.com$/);
    });

    it('配列から要素を選択できる', () => {
      const arr = ['a', 'b', 'c'];
      const element = randomHelpers.arrayElement(arr);
      expect(arr).toContain(element);
    });

    it('指定範囲の整数を生成できる', () => {
      const num = randomHelpers.integer(5, 10);
      expect(num).toBeGreaterThanOrEqual(5);
      expect(num).toBeLessThanOrEqual(10);
      expect(Number.isInteger(num)).toBe(true);
    });
  });

  describe('dateHelpers', () => {
    it('今日の日付を正しい形式で返す', () => {
      const today = dateHelpers.today();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('指定日数後の日付を返す', () => {
      const futureDate = dateHelpers.daysFromNow(7);
      expect(futureDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('ISO形式の現在時刻を返す', () => {
      const now = dateHelpers.now();
      expect(now).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});

describe('基本ファクトリー関数', () => {
  beforeEach(() => {
    resetFactorySequences();
  });

  describe('createMockUser', () => {
    it('デフォルト値でユーザーを作成できる', () => {
      const user = createMockUser();
      
      expect(user.id).toBe('user-1');
      expect(user.email).toMatch(/^test-.+@example\.com$/);
      expect(user.role).toBe('user');
      expect(user.email_confirmed_at).toBeTruthy();
      expect(user.created_at).toBeTruthy();
      expect(user.updated_at).toBeTruthy();
    });

    it('オーバーライドで値を上書きできる', () => {
      const user = createMockUser({
        email: 'custom@test.com',
        role: 'admin',
      });
      
      expect(user.email).toBe('custom@test.com');
      expect(user.role).toBe('admin');
    });

    it('シーケンシャルなIDを生成する', () => {
      const user1 = createMockUser();
      const user2 = createMockUser();
      
      expect(user1.id).toBe('user-1');
      expect(user2.id).toBe('user-2');
    });
  });

  describe('createMockWorkOrder', () => {
    it('完全なワークオーダーを作成できる', () => {
      const workOrder = createMockWorkOrder();
      
      expect(workOrder.id).toBe(1);
      expect(workOrder.file_name).toMatch(/^work-order-\d+\.pdf$/);
      expect(workOrder.status).toBe('completed');
      expect(workOrder.company_name).toBeTruthy();
      expect(workOrder.generated_text).toBeTruthy();
      expect(workOrder.token_usage).toBeDefined();
      expect(workOrder.token_usage!.total).toBe(
        workOrder.token_usage!.prompt + workOrder.token_usage!.completion
      );
    });

    it('会社名に応じたテキストを生成する', () => {
      const workOrder = createMockWorkOrder({
        company_name: '野原G住環境',
      });
      
      expect(workOrder.generated_text).toContain('グリーンマンション');
    });
  });

  describe('createMockShift', () => {
    it('シフトデータを作成できる', () => {
      const shift = createMockShift();
      
      expect(shift.id).toBe(1);
      expect(shift.user_id).toMatch(/^user-\d+$/);
      expect(shift.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(['morning', 'afternoon', 'night', 'custom']).toContain(shift.shift_type);
      expect(shift.status).toBe('scheduled');
    });
  });
});

describe('複数データ生成', () => {
  beforeEach(() => {
    resetFactorySequences();
  });

  it('指定した数のユーザーを作成できる', () => {
    const users = createMockUsers(5);
    
    expect(users).toHaveLength(5);
    expect(users[0].id).toBe('user-1');
    expect(users[4].id).toBe('user-5');
  });

  it('指定した数のワークオーダーを作成できる', () => {
    const workOrders = createMockWorkOrders(3);
    
    expect(workOrders).toHaveLength(3);
    workOrders.forEach(wo => {
      expect(wo.id).toBeGreaterThan(0);
    });
  });

  it('オーバーライドが全てのデータに適用される', () => {
    const workOrders = createMockWorkOrders(3, { status: 'error' });
    
    workOrders.forEach(wo => {
      expect(wo.status).toBe('error');
    });
  });
});

describe('特殊パターンファクトリー', () => {
  it('特定の会社用のワークオーダーを作成できる', () => {
    const workOrder = createMockWorkOrderForCompany('NOHARA_G');
    
    expect(workOrder.company_name).toBe('野原G住環境');
    expect(workOrder.prompt_identifier).toBe('NOHARA_G_V20250605');
    expect(workOrder.generated_text).toContain('グリーンマンション');
  });

  it('エラー状態のワークオーダーを作成できる', () => {
    const workOrder = createMockWorkOrderWithError('カスタムエラー');
    
    expect(workOrder.status).toBe('error');
    expect(workOrder.error_message).toBe('カスタムエラー');
    expect(workOrder.generated_text).toBe('');
    expect(workOrder.gemini_processed_at).toBeUndefined();
  });

  it('処理中のワークオーダーを作成できる', () => {
    const workOrder = createMockWorkOrderProcessing();
    
    expect(workOrder.status).toBe('processing');
    expect(workOrder.generated_text).toBe('');
    expect(workOrder.gemini_processed_at).toBeUndefined();
  });

  it('関連データ付きのユーザーを作成できる', () => {
    const result = createMockUserWithRelatedData();
    
    expect(result.user).toBeDefined();
    expect(result.workOrders.length).toBeGreaterThan(0);
    expect(result.shifts.length).toBeGreaterThan(0);
    
    // 関連性を確認
    result.workOrders.forEach(wo => {
      expect(wo.user_id).toBe(result.user.id);
    });
    result.shifts.forEach(shift => {
      expect(shift.user_id).toBe(result.user.id);
    });
  });

  it('週間シフトを作成できる', () => {
    const shifts = createMockWeeklyShifts('user-1', '2025-06-06');
    
    expect(shifts.length).toBeGreaterThan(0);
    expect(shifts.length).toBeLessThanOrEqual(7);
    
    shifts.forEach(shift => {
      expect(shift.user_id).toBe('user-1');
      expect(shift.date).toMatch(/^2025-06-/);
    });
  });
});

describe('APIレスポンスファクトリー', () => {
  it('認証レスポンスを作成できる', () => {
    const response = createMockAuthResponse();
    
    expect(response.access_token).toMatch(/^mock-access-token-/);
    expect(response.token_type).toBe('bearer');
    expect(response.expires_in).toBe(3600);
    expect(response.user).toBeDefined();
  });

  it('PDF処理レスポンスを作成できる', () => {
    const response = createMockPdfProcessingResponse();
    
    expect(response.success).toBe(true);
    expect(response.generatedText).toBeTruthy();
    expect(response.tokenUsage.total).toBe(
      response.tokenUsage.prompt + response.tokenUsage.completion
    );
  });

  it('エラーレスポンスを作成できる', () => {
    const response = createMockErrorResponse('テストエラー', 500);
    
    expect(response.error).toBe('テストエラー');
    expect(response.status).toBe(500);
    expect(response.timestamp).toBeTruthy();
  });

  it('Supabaseレスポンスを作成できる', () => {
    const data = [{ id: 1, name: 'test' }];
    const response = createMockSupabaseResponse(data);
    
    expect(response.data).toEqual(data);
    expect(response.error).toBeNull();
    expect(response.count).toBe(1);
    expect(response.status).toBe(200);
  });

  it('Supabaseエラーレスポンスを作成できる', () => {
    const response = createMockSupabaseResponse([], true);
    
    expect(response.data).toBeNull();
    expect(response.error).toBeDefined();
    expect(response.status).toBe(400);
  });
});

describe('プリセット', () => {
  it('完全なデータセットを作成できる', () => {
    const dataset = createMockFullDataset();
    
    expect(dataset.users.length).toBe(4); // 3 users + 1 admin
    expect(dataset.adminUser.role).toBe('admin');
    expect(dataset.workOrders.length).toBeGreaterThan(0);
    expect(dataset.shifts.length).toBeGreaterThan(0);
  });

  it('新規ユーザープリセットが空のデータを返す', () => {
    const preset = testPresets.newUser();
    
    expect(preset.user).toBeDefined();
    expect(preset.workOrders).toHaveLength(0);
    expect(preset.shifts).toHaveLength(0);
  });

  it('アクティブユーザープリセットが多くのデータを返す', () => {
    const preset = testPresets.activeUser();
    
    expect(preset.user).toBeDefined();
    expect(preset.workOrders.length).toBe(10);
    expect(preset.shifts.length).toBe(20);
  });

  it('問題のあるユーザープリセットがエラーデータを返す', () => {
    const preset = testPresets.problematicUser();
    
    expect(preset.user).toBeDefined();
    preset.workOrders.forEach(wo => {
      expect(wo.status).toBe('error');
    });
    preset.shifts.forEach(shift => {
      expect(shift.status).toBe('cancelled');
    });
  });

  it('企業別データプリセットが正しい会社データを返す', () => {
    const preset = testPresets.companySpecificData();
    
    expect(preset.noharaG.company_name).toBe('野原G住環境');
    expect(preset.katoubeniya.company_name).toBe('加藤ベニヤ池袋_ミサワホーム');
    expect(preset.yamadaK.company_name).toBe('山田K建設 (準備中)');
  });
});

describe('シーケンスリセット', () => {
  it('シーケンスリセット後にIDが1から始まる', () => {
    // 最初にいくつかのデータを作成
    createMockUser();
    createMockUser();
    createMockWorkOrder();
    
    // リセット
    resetFactorySequences();
    
    // 新しいデータが1から始まることを確認
    const user = createMockUser();
    const workOrder = createMockWorkOrder();
    
    expect(user.id).toBe('user-1');
    expect(workOrder.id).toBe(1);
  });
});