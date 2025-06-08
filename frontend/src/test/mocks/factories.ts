/**
 * テストデータファクトリー
 * 
 * 一貫性のあるテストデータを簡単に生成するためのファクトリー関数群。
 * 各ファクトリーはデフォルト値を提供し、必要に応じてオーバーライド可能。
 */

import { COMPANY_OPTIONS_CONST, type CompanyOptionValue } from '../../types';

// 型を再エクスポート
export type { CompanyOptionValue };

// シーケンス管理（一意なIDやインデックスの生成）
let userIdSequence = 1;
let workOrderIdSequence = 1;
let shiftIdSequence = 1;
let fileNameSequence = 1;

// シーケンスをリセットする関数（テスト間でのクリーンアップ用）
export function resetFactorySequences() {
  userIdSequence = 1;
  workOrderIdSequence = 1;
  shiftIdSequence = 1;
  fileNameSequence = 1;
}

// ランダムな値を生成するヘルパー関数
export const randomHelpers = {
  // ランダムな文字列（指定した長さ）
  string: (length = 8): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  },

  // ランダムなメールアドレス
  email: (): string => `test-${randomHelpers.string(6)}@example.com`,

  // ランダムな日付（過去30日以内）
  pastDate: (): string => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    return date.toISOString();
  },

  // ランダムな日付（未来30日以内）
  futureDate: (): string => {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * 30));
    return date.toISOString();
  },

  // ランダムな配列要素を選択
  arrayElement: <T>(array: readonly T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  },

  // ランダムなブール値
  boolean: (): boolean => Math.random() > 0.5,

  // ランダムな整数（範囲指定）
  integer: (min = 0, max = 100): number => Math.floor(Math.random() * (max - min + 1)) + min,
};

// 日時関連のヘルパー
export const dateHelpers = {
  // 今日の日付文字列（YYYY-MM-DD形式）
  today: (): string => new Date().toISOString().split('T')[0],

  // 指定日数前/後の日付
  daysFromNow: (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  },

  // ISO文字列（現在時刻）
  now: (): string => new Date().toISOString(),

  // 指定時間前/後のISO文字列
  hoursFromNow: (hours: number): string => {
    const date = new Date();
    date.setHours(date.getHours() + hours);
    return date.toISOString();
  },
};

export interface MockUser {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  role?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}

export interface MockWorkOrder {
  id: number;
  file_name: string;
  uploaded_at: string;
  company_name: string;
  prompt_identifier: string;
  generated_text: string;
  edited_text?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error_message?: string;
  gemini_processed_at?: string;
  user_id?: string;
  file_size?: number;
  processing_time_ms?: number;
  updated_at?: string;
  token_usage?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface MockShift {
  id: number;
  user_id: string;
  date: string;
  shift_type: 'morning' | 'afternoon' | 'night' | 'custom';
  custom_end_time?: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

// ======================
// 基本ファクトリー関数
// ======================

// ユーザーデータのファクトリー
export function createMockUser(overrides?: Partial<MockUser>): MockUser {
  const now = dateHelpers.now();
  const id = `user-${userIdSequence++}`;
  
  return {
    id,
    email: overrides?.email || randomHelpers.email(),
    email_confirmed_at: now,
    created_at: now,
    updated_at: now,
    role: 'user',
    user_metadata: {},
    app_metadata: {},
    ...overrides,
  };
}

// テンプレート生成のヘルパー関数
function generateSampleWorkOrderText(companyName: string): string {
  const templates = {
    '野原G住環境': `物件名：グリーンマンション102号室
工事内容：内装リフォーム工事
日付：${new Date().toLocaleDateString('ja-JP')}
作業者：田中太郎
作業時間：9:00〜17:00
注意事項：床材保護シート設置必須`,
    
    '加藤ベニヤ池袋_ミサワホーム': `工事場所：池袋新築現場A-3
作業内容：ベニヤ板設置作業
作業日：${new Date().toLocaleDateString('ja-JP')}
担当者：佐藤次郎
予定時間：8:30〜16:30
備考：雨天中止`,
    
    default: `工事名：一般建設工事
内容：${companyName}関連作業
実施日：${new Date().toLocaleDateString('ja-JP')}
作業員：山田花子
時間：9:00〜17:00`
  };
  
  return templates[companyName as keyof typeof templates] || templates.default;
}

// 作業指示書データのファクトリー
export function createMockWorkOrder(overrides?: Partial<MockWorkOrder>): MockWorkOrder {
  const now = dateHelpers.now();
  const id = workOrderIdSequence++;
  const fileName = `work-order-${fileNameSequence++}.pdf`;
  const companyOption = randomHelpers.arrayElement(COMPANY_OPTIONS_CONST);
  
  return {
    id,
    file_name: fileName,
    uploaded_at: now,
    company_name: companyOption.label,
    prompt_identifier: `${companyOption.value}_V20250605`,
    generated_text: generateSampleWorkOrderText(companyOption.label),
    status: 'completed',
    gemini_processed_at: now,
    user_id: `user-${randomHelpers.integer(1, 10)}`,
    file_size: randomHelpers.integer(100000, 5000000), // 100KB - 5MB
    processing_time_ms: randomHelpers.integer(1000, 10000),
    token_usage: (() => {
      const prompt = randomHelpers.integer(50, 200);
      const completion = randomHelpers.integer(25, 100);
      return { prompt, completion, total: prompt + completion };
    })(),
    ...overrides,
  };
}

// シフトデータのファクトリー
export function createMockShift(overrides?: Partial<MockShift>): MockShift {
  const now = dateHelpers.now();
  const id = shiftIdSequence++;
  const shiftTypes: MockShift['shift_type'][] = ['morning', 'afternoon', 'night', 'custom'];
  
  return {
    id,
    user_id: `user-${randomHelpers.integer(1, 10)}`,
    date: dateHelpers.daysFromNow(randomHelpers.integer(-7, 30)), // 1週間前から30日後
    shift_type: randomHelpers.arrayElement(shiftTypes),
    created_at: now,
    updated_at: now,
    status: 'scheduled',
    ...overrides,
  };
}

// ======================
// 複数データ生成ヘルパー
// ======================

export function createMockUsers(count: number, overrides?: Partial<MockUser>): MockUser[] {
  return Array.from({ length: count }, () => createMockUser(overrides));
}

export function createMockWorkOrders(count: number, overrides?: Partial<MockWorkOrder>): MockWorkOrder[] {
  return Array.from({ length: count }, () => createMockWorkOrder(overrides));
}

export function createMockShifts(count: number, overrides?: Partial<MockShift>): MockShift[] {
  return Array.from({ length: count }, () => createMockShift(overrides));
}

// ======================
// 特殊なパターンのファクトリー
// ======================

// 特定の会社用のワークオーダー
export function createMockWorkOrderForCompany(companyValue: CompanyOptionValue, overrides?: Partial<MockWorkOrder>): MockWorkOrder {
  const companyOption = COMPANY_OPTIONS_CONST.find(c => c.value === companyValue);
  if (!companyOption) {
    throw new Error(`Unknown company value: ${companyValue}`);
  }
  
  return createMockWorkOrder({
    company_name: companyOption.label,
    prompt_identifier: `${companyValue}_V20250605`,
    generated_text: generateSampleWorkOrderText(companyOption.label),
    ...overrides,
  });
}

// エラー状態のワークオーダー
export function createMockWorkOrderWithError(errorMessage?: string, overrides?: Partial<MockWorkOrder>): MockWorkOrder {
  return createMockWorkOrder({
    status: 'error',
    error_message: errorMessage || 'PDF処理中にエラーが発生しました',
    generated_text: '',
    gemini_processed_at: undefined,
    ...overrides,
  });
}

// 処理中のワークオーダー
export function createMockWorkOrderProcessing(overrides?: Partial<MockWorkOrder>): MockWorkOrder {
  return createMockWorkOrder({
    status: 'processing',
    generated_text: '',
    gemini_processed_at: undefined,
    processing_time_ms: undefined,
    ...overrides,
  });
}

// 特定のユーザーに関連するデータセット
export function createMockUserWithRelatedData(userOverrides?: Partial<MockUser>) {
  const user = createMockUser(userOverrides);
  const workOrders = createMockWorkOrders(randomHelpers.integer(1, 5), { user_id: user.id });
  const shifts = createMockShifts(randomHelpers.integer(2, 10), { user_id: user.id });
  
  return { user, workOrders, shifts };
}

// 週間シフトスケジュール
export function createMockWeeklyShifts(userId: string, startDate?: string): MockShift[] {
  const start = startDate ? new Date(startDate) : new Date();
  const shifts: MockShift[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    
    // 土日は休みの可能性が高い
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    if (isWeekend && randomHelpers.boolean()) {
      continue; // 50%の確率で休み
    }
    
    shifts.push(createMockShift({
      user_id: userId,
      date: date.toISOString().split('T')[0],
      shift_type: isWeekend ? 'custom' : randomHelpers.arrayElement(['morning', 'afternoon']),
    }));
  }
  
  return shifts;
}

// ======================
// APIレスポンスファクトリー
// ======================

// Supabase認証レスポンスのファクトリー
export function createMockAuthResponse(user?: MockUser) {
  const mockUser = user || createMockUser();
  return {
    access_token: `mock-access-token-${randomHelpers.string(32)}`,
    token_type: 'bearer' as const,
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: `mock-refresh-token-${randomHelpers.string(32)}`,
    user: mockUser,
  };
}

// Edge Function レスポンスのファクトリー
export interface MockPdfProcessingResponse {
  success: boolean;
  generatedText: string;
  promptIdentifier: string;
  processingTime: number;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
  dbRecordId?: string;
  originalFileName?: string;
}

export function createMockPdfProcessingResponse(overrides?: Partial<MockPdfProcessingResponse>): MockPdfProcessingResponse {
  const tokenUsage = (() => {
    const prompt = randomHelpers.integer(50, 200);
    const completion = randomHelpers.integer(25, 100);
    return { prompt, completion, total: prompt + completion };
  })();

  return {
    success: true,
    generatedText: generateSampleWorkOrderText('野原G住環境'),
    promptIdentifier: 'NOHARA_G_V20250605',
    processingTime: randomHelpers.integer(1000, 8000),
    tokenUsage,
    dbRecordId: `work-order-${randomHelpers.string(8)}`,
    originalFileName: `uploaded-file-${randomHelpers.string(6)}.pdf`,
    ...overrides,
  };
}

// エラーレスポンスのファクトリー
export interface MockErrorResponse {
  error: string;
  error_description: string;
  status: number;
  timestamp?: string;
  path?: string;
}

export function createMockErrorResponse(message: string, status = 400, overrides?: Partial<MockErrorResponse>): MockErrorResponse {
  return {
    error: message,
    error_description: message,
    status,
    timestamp: dateHelpers.now(),
    ...overrides,
  };
}

// Supabaseデータベースレスポンスのファクトリー
export function createMockSupabaseResponse<T>(data: T[], error: boolean = false) {
  if (error) {
    return {
      data: null,
      error: {
        message: 'Database error occurred',
        details: 'Mock database error for testing',
        hint: '',
        code: 'PGRST000',
      },
      count: null,
      status: 400,
      statusText: 'Bad Request',
    };
  }

  return {
    data,
    error: null,
    count: data.length,
    status: 200,
    statusText: 'OK',
  };
}

// ======================
// 便利なプリセット
// ======================

// 完全なテストデータセット（デモ用）
export function createMockFullDataset() {
  const users = createMockUsers(3, { role: 'user' });
  const adminUser = createMockUser({ role: 'admin', email: 'admin@example.com' });
  
  const allUsers = [...users, adminUser];
  const allWorkOrders: MockWorkOrder[] = [];
  const allShifts: MockShift[] = [];
  
  // 各ユーザーにデータを割り当て
  allUsers.forEach(user => {
    const userWorkOrders = createMockWorkOrders(randomHelpers.integer(1, 3), { user_id: user.id });
    const userShifts = createMockWeeklyShifts(user.id);
    
    allWorkOrders.push(...userWorkOrders);
    allShifts.push(...userShifts);
  });
  
  return {
    users: allUsers,
    workOrders: allWorkOrders,
    shifts: allShifts,
    adminUser,
  };
}

// テストシナリオ用のプリセット
export const testPresets = {
  // 新規ユーザー（データなし）
  newUser: () => ({
    user: createMockUser(),
    workOrders: [],
    shifts: [],
  }),
  
  // アクティブユーザー（多くのデータ）
  activeUser: () => {
    const user = createMockUser();
    return {
      user,
      workOrders: createMockWorkOrders(10, { user_id: user.id }),
      shifts: createMockShifts(20, { user_id: user.id }),
    };
  },
  
  // エラーが多いユーザー
  problematicUser: () => {
    const user = createMockUser();
    const errorWorkOrders = Array.from({ length: 3 }, () => 
      createMockWorkOrderWithError('処理エラー', { user_id: user.id })
    );
    const cancelledShifts = createMockShifts(5, { 
      user_id: user.id, 
      status: 'cancelled' 
    });
    
    return {
      user,
      workOrders: errorWorkOrders,
      shifts: cancelledShifts,
    };
  },
  
  // 企業別のワークオーダー
  companySpecificData: () => ({
    noharaG: createMockWorkOrderForCompany('NOHARA_G'),
    katoubeniya: createMockWorkOrderForCompany('KATOUBENIYA_MISAWA'),
    yamadaK: createMockWorkOrderForCompany('YAMADA_K'),
  }),
};