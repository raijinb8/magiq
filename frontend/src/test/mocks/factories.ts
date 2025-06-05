// テストデータを生成するファクトリー関数

export interface MockUser {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
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
}

export interface MockShift {
  id: number;
  user_id: string;
  date: string;
  shift_type: 'morning' | 'afternoon' | 'night' | 'custom';
  custom_end_time?: string;
  note?: string;
}

// ユーザーデータのファクトリー
export function createMockUser(overrides?: Partial<MockUser>): MockUser {
  return {
    id: 'mock-user-id',
    email: 'test@example.com',
    email_confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// 作業指示書データのファクトリー
export function createMockWorkOrder(overrides?: Partial<MockWorkOrder>): MockWorkOrder {
  return {
    id: 1,
    file_name: 'test-work-order.pdf',
    uploaded_at: new Date().toISOString(),
    company_name: '野原G住環境',
    prompt_identifier: 'NOHARA_G_V20250526',
    generated_text: `物件名：テストマンション
工事内容：内装リフォーム工事
日付：${new Date().toLocaleDateString('ja-JP')}
作業者：田中太郎
作業時間：9:00〜17:00`,
    status: 'completed',
    gemini_processed_at: new Date().toISOString(),
    ...overrides,
  };
}

// シフトデータのファクトリー
export function createMockShift(overrides?: Partial<MockShift>): MockShift {
  return {
    id: 1,
    user_id: 'mock-user-id',
    date: new Date().toISOString().split('T')[0],
    shift_type: 'morning',
    ...overrides,
  };
}

// 複数のデータを生成するヘルパー
export function createMockWorkOrders(count: number, overrides?: Partial<MockWorkOrder>): MockWorkOrder[] {
  return Array.from({ length: count }, (_, index) => 
    createMockWorkOrder({
      id: index + 1,
      file_name: `test-work-order-${index + 1}.pdf`,
      ...overrides,
    })
  );
}

export function createMockShifts(count: number, overrides?: Partial<MockShift>): MockShift[] {
  const shiftTypes: MockShift['shift_type'][] = ['morning', 'afternoon', 'night', 'custom'];
  
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    
    return createMockShift({
      id: index + 1,
      date: date.toISOString().split('T')[0],
      shift_type: shiftTypes[index % shiftTypes.length],
      ...overrides,
    });
  });
}

// Supabase認証レスポンスのファクトリー
export function createMockAuthResponse(user: MockUser) {
  return {
    access_token: 'mock-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'mock-refresh-token',
    user,
  };
}

// Edge Function レスポンスのファクトリー
interface MockPdfProcessingResponse {
  success: boolean;
  generatedText: string;
  promptIdentifier: string;
  processingTime: number;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export function createMockPdfProcessingResponse(overrides?: Partial<MockPdfProcessingResponse>): MockPdfProcessingResponse {
  return {
    success: true,
    generatedText: `物件名：テストマンション
工事内容：内装リフォーム工事
日付：${new Date().toLocaleDateString('ja-JP')}`,
    promptIdentifier: 'NOHARA_G_V20250526',
    processingTime: 1234,
    tokenUsage: {
      prompt: 100,
      completion: 50,
      total: 150,
    },
    ...overrides,
  };
}

// エラーレスポンスのファクトリー
export function createMockErrorResponse(message: string, status = 400) {
  return {
    error: message,
    error_description: message,
    status,
  };
}